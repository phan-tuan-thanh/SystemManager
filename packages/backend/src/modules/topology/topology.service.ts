import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TopologyData, DependencyData, ServerNode, ConnectionEdge, ImpliedConnectionEdge } from './topology.types';

function ipMatchesCidrOrExactTopology(ip: string, cidrOrIp: string): boolean {
  if (ip === cidrOrIp) return true;
  if (!cidrOrIp.includes('/')) return false;
  const [network, bits] = cidrOrIp.split('/');
  const prefixLen = parseInt(bits, 10);
  const ipToInt = (s: string) =>
    s.split('.').reduce((acc, oct) => (acc << 8) | parseInt(oct, 10), 0) >>> 0;
  const mask = prefixLen === 0 ? 0 : ((0xffffffff << (32 - prefixLen)) >>> 0);
  return (ipToInt(ip) & mask) === (ipToInt(network) & mask);
}

@Injectable()
export class TopologyService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopology(environment?: string): Promise<TopologyData> {
    const envFilter = environment ? { environment: environment as any } : {};

    const servers = await this.prisma.server.findMany({
      where: { deleted_at: null, ...envFilter },
      include: {
        app_deployments: {
          where: { deleted_at: null, ...envFilter },
          include: {
            application: {
              include: { group: true },
            },
            ports: {
              where: { deleted_at: null },
              select: { id: true, port_number: true, protocol: true, service_name: true },
            },
          },
        },
        network_configs: {
          where: { deleted_at: null },
        },
      },
    });

    const connections = await this.prisma.appConnection.findMany({
      where: { deleted_at: null, ...envFilter },
      include: {
        source_app: true,
        target_app: true,
        target_port: {
          select: { id: true, port_number: true, protocol: true, service_name: true },
        },
      },
    });

    const serverNodes: ServerNode[] = servers.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      hostname: s.hostname,
      purpose: s.purpose,
      status: s.status,
      environment: s.environment,
      infra_type: s.infra_type,
      site: s.site,
      description: s.description ?? undefined,
      deployments: s.app_deployments.map((d) => ({
        id: d.id,
        version: d.version,
        status: d.status,
        environment: d.environment,
        application: {
          id: d.application.id,
          code: d.application.code,
          name: d.application.name,
          version: d.application.version ?? undefined,
          groupName: d.application.group?.name ?? undefined,
          owner_team: d.application.owner_team ?? undefined,
          application_type: d.application.application_type,
          ports: d.ports.map((p) => ({
            id: p.id,
            port_number: p.port_number,
            protocol: p.protocol,
            service_name: p.service_name ?? undefined,
          })),
        },
      })),
      networkConfigs: s.network_configs.map((n) => ({
        id: n.id,
        interface: n.interface ?? undefined,
        private_ip: n.private_ip ?? undefined,
        public_ip: n.public_ip ?? undefined,
        domain: n.domain ?? undefined,
      })),
    }));

    const connectionEdges: ConnectionEdge[] = connections.map((c) => ({
      id: c.id,
      sourceAppId: c.source_app_id,
      targetAppId: c.target_app_id,
      sourceAppName: c.source_app.name,
      targetAppName: c.target_app.name,
      connectionType: c.connection_type,
      environment: c.environment,
      description: c.description ?? undefined,
      targetPort: c.target_port
        ? {
            id: c.target_port.id,
            port_number: c.target_port.port_number,
            protocol: c.target_port.protocol,
            service_name: c.target_port.service_name ?? undefined,
          }
        : undefined,
    }));

    const impliedConnections = environment
      ? await this.getImpliedConnections(environment)
      : [];

    return { servers: serverNodes, connections: connectionEdges, impliedConnections };
  }

  async getImpliedConnections(environment: string): Promise<ImpliedConnectionEdge[]> {
    // Step 1: get all active ALLOW rules for the environment
    const rules = await this.prisma.firewallRule.findMany({
      where: {
        action: 'ALLOW',
        status: 'ACTIVE',
        environment: environment as any,
        deleted_at: null,
      },
      include: {
        destination_server: {
          include: {
            app_deployments: {
              where: { deleted_at: null, environment: environment as any },
              include: { application: { select: { id: true, name: true } } },
            },
            network_configs: { where: { deleted_at: null } },
          },
        },
        destination_port: {
          include: { application: { select: { id: true, name: true } } },
        },
        source_zone: {
          include: { ip_entries: { where: { deleted_at: null } } },
        },
      },
    });

    // Load all explicit AppConnections for dedup check later
    const explicitConns = await this.prisma.appConnection.findMany({
      where: { environment: environment as any, deleted_at: null },
      select: { source_app_id: true, target_app_id: true },
    });
    const explicitSet = new Set(
      explicitConns.map((c) => `${c.source_app_id}::${c.target_app_id}`),
    );

    // Load all servers with network configs for source resolution
    const allServers = await this.prisma.server.findMany({
      where: { deleted_at: null },
      include: {
        network_configs: { where: { deleted_at: null } },
        app_deployments: {
          where: { deleted_at: null, environment: environment as any },
          include: { application: { select: { id: true, name: true } } },
        },
      },
    });

    const implied: ImpliedConnectionEdge[] = [];
    // dedup by sourceAppId + targetAppId
    const seenPairs = new Set<string>();

    for (const rule of rules) {
      // Step 3a: identify target app from destination_port
      if (!rule.destination_port || !rule.destination_port.application_id) continue;

      const targetAppId = rule.destination_port.application_id;
      const targetAppName = rule.destination_port.application.name;

      // Step 3c: verify target app is deployed on destination_server in env
      const targetDeployedOnServer = rule.destination_server.app_deployments.some(
        (d) => d.application_id === targetAppId,
      );
      if (!targetDeployedOnServer) continue;

      // Step 3d: find source servers
      const sourceServers: typeof allServers = [];

      if (rule.source_ip) {
        // Match by direct IP
        for (const srv of allServers) {
          const matches = srv.network_configs.some(
            (nc) =>
              (nc.private_ip && nc.private_ip === rule.source_ip) ||
              (nc.public_ip && nc.public_ip === rule.source_ip),
          );
          if (matches) sourceServers.push(srv);
        }
      } else if (rule.source_zone) {
        // Match by zone IP entries
        const zoneIps = rule.source_zone.ip_entries.map((e) => e.ip_address);
        for (const srv of allServers) {
          const serverIps = srv.network_configs.flatMap((nc) => {
            const ips: string[] = [];
            if (nc.private_ip) ips.push(nc.private_ip);
            if (nc.public_ip) ips.push(nc.public_ip);
            return ips;
          });
          const matches = serverIps.some((sip) =>
            zoneIps.some((zip) => ipMatchesCidrOrExactTopology(sip, zip)),
          );
          if (matches) sourceServers.push(srv);
        }
      }

      // Step 3e-3f: for each source server, get its apps and create implied edges
      for (const srcSrv of sourceServers) {
        for (const dep of srcSrv.app_deployments) {
          const sourceAppId = dep.application_id;
          const sourceAppName = dep.application.name;

          // Skip self-loops
          if (sourceAppId === targetAppId) continue;

          const pairKey = `${sourceAppId}::${targetAppId}`;

          // Skip if already explicit or already added as implied
          if (explicitSet.has(pairKey) || seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          implied.push({
            id: `implied-${rule.id}-${sourceAppId}-${targetAppId}`,
            sourceAppId,
            targetAppId,
            sourceAppName,
            targetAppName,
            environment,
            firewallRuleId: rule.id,
            firewallRuleName: rule.name,
            targetPort: rule.destination_port
              ? {
                  id: rule.destination_port.id,
                  port_number: rule.destination_port.port_number,
                  protocol: rule.destination_port.protocol,
                  service_name: rule.destination_port.service_name ?? undefined,
                }
              : undefined,
          });
        }
      }
    }

    return implied;
  }

  async getAppDependency(appId: string): Promise<DependencyData> {
    const upstreamConnections = await this.prisma.appConnection.findMany({
      where: { target_app_id: appId, deleted_at: null },
      include: { source_app: true, target_app: true, target_port: { select: { id: true, port_number: true, protocol: true, service_name: true } } },
    });

    const downstreamConnections = await this.prisma.appConnection.findMany({
      where: { source_app_id: appId, deleted_at: null },
      include: { source_app: true, target_app: true, target_port: { select: { id: true, port_number: true, protocol: true, service_name: true } } },
    });

    const toEdge = (c: any): ConnectionEdge => ({
      id: c.id,
      sourceAppId: c.source_app_id,
      targetAppId: c.target_app_id,
      sourceAppName: c.source_app.name,
      targetAppName: c.target_app.name,
      connectionType: c.connection_type,
      environment: c.environment,
      description: c.description ?? undefined,
      targetPort: c.target_port
        ? {
            port_number: c.target_port.port_number,
            protocol: c.target_port.protocol,
            service_name: c.target_port.service_name ?? undefined,
          }
        : undefined,
    });

    return {
      upstream: upstreamConnections.map(toEdge),
      downstream: downstreamConnections.map(toEdge),
    };
  }
}
