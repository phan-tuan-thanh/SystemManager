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
    const rules = await this.prisma.firewallRule.findMany({
      where: {
        action: { in: ['ALLOW', 'DENY'] },
        status: { notIn: ['INACTIVE', 'REJECTED'] as any[] },
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

    const explicitConns = await this.prisma.appConnection.findMany({
      where: { environment: environment as any, deleted_at: null },
      select: { source_app_id: true, target_app_id: true },
    });
    const explicitSet = new Set(
      explicitConns.map((c) => `${c.source_app_id}::${c.target_app_id}`),
    );

    // All servers with IPs + their env deployments (for source resolution)
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
    const seenAllow = new Set<string>();
    const seenDeny = new Set<string>();

    for (const rule of rules) {
      // Determine target apps:
      // - If destination_port is set → use port's application as the sole target
      // - If destination_port is null → use ALL apps deployed on destination_server in this env
      const targetApps: Array<{ appId: string; appName: string }> = [];

      if (rule.destination_port?.application) {
        targetApps.push({
          appId: rule.destination_port.application.id,
          appName: rule.destination_port.application.name,
        });
      } else {
        for (const dep of rule.destination_server.app_deployments) {
          targetApps.push({ appId: dep.application_id, appName: dep.application.name });
        }
      }

      // Find source servers by IP or zone
      const sourceServers: typeof allServers = [];

      if (rule.source_ip) {
        for (const srv of allServers) {
          const matches = srv.network_configs.some(
            (nc) =>
              (nc.private_ip && nc.private_ip === rule.source_ip) ||
              (nc.public_ip && nc.public_ip === rule.source_ip),
          );
          if (matches) sourceServers.push(srv);
        }
      } else if (rule.source_zone) {
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

      if (sourceServers.length === 0) continue;

      const targetPortInfo = rule.destination_port
        ? {
            id: rule.destination_port.id,
            port_number: rule.destination_port.port_number,
            protocol: rule.destination_port.protocol,
            service_name: rule.destination_port.service_name ?? undefined,
          }
        : rule.destination_port_number
        ? {
            id: `manual-${rule.id}`,
            port_number: rule.destination_port_number,
            protocol: rule.protocol,
            service_name: undefined,
          }
        : undefined;

      // If destination server has no app deployments, emit server-to-server implied edges
      if (targetApps.length === 0) {
        for (const srcSrv of sourceServers) {
          const srvPairKey = `${rule.action}::${srcSrv.id}::${rule.destination_server_id}`;
          const seenSrv = rule.action === 'DENY' ? seenDeny : seenAllow;
          if (seenSrv.has(srvPairKey)) continue;
          seenSrv.add(srvPairKey);
          implied.push({
            id: `implied-${rule.action}-${rule.id}-srv-${srcSrv.id}`,
            sourceAppId: '',
            targetAppId: '',
            sourceAppName: srcSrv.name,
            targetAppName: rule.destination_server.name,
            sourceServerId: srcSrv.id,
            targetServerId: rule.destination_server_id,
            environment,
            firewallRuleId: rule.id,
            firewallRuleName: rule.name,
            action: rule.action,
            targetPort: targetPortInfo,
          });
        }
        continue;
      }

      // Generate one implied edge per (sourceApp × targetApp) pair
      for (const srcSrv of sourceServers) {
        // When source server itself has no app deployments, emit server-to-server edges per target app's server
        if (srcSrv.app_deployments.length === 0) {
          const srvPairKey = `${rule.action}::${srcSrv.id}::${rule.destination_server_id}`;
          const seenSrv = rule.action === 'DENY' ? seenDeny : seenAllow;
          if (!seenSrv.has(srvPairKey)) {
            seenSrv.add(srvPairKey);
            implied.push({
              id: `implied-${rule.action}-${rule.id}-srv-${srcSrv.id}`,
              sourceAppId: '',
              targetAppId: targetApps[0].appId,
              sourceAppName: srcSrv.name,
              targetAppName: targetApps[0].appName,
              sourceServerId: srcSrv.id,
              targetServerId: rule.destination_server_id,
              environment,
              firewallRuleId: rule.id,
              firewallRuleName: rule.name,
              action: rule.action,
              targetPort: targetPortInfo,
            });
          }
          continue;
        }

        for (const srcDep of srcSrv.app_deployments) {
          for (const tgt of targetApps) {
            const sourceAppId = srcDep.application_id;
            const targetAppId = tgt.appId;

            if (sourceAppId === targetAppId) continue;

            const pairKey = `${sourceAppId}::${targetAppId}`;
            const seen = rule.action === 'DENY' ? seenDeny : seenAllow;

            // ALLOW: omit if an explicit AppConnection already covers this pair
            if (rule.action === 'ALLOW' && explicitSet.has(pairKey)) continue;
            if (seen.has(pairKey)) continue;
            seen.add(pairKey);

            implied.push({
              id: `implied-${rule.action}-${rule.id}-${sourceAppId}-${targetAppId}`,
              sourceAppId,
              targetAppId,
              sourceAppName: srcDep.application.name,
              targetAppName: tgt.appName,
              sourceServerId: srcSrv.id,
              targetServerId: rule.destination_server_id,
              environment,
              firewallRuleId: rule.id,
              firewallRuleName: rule.name,
              action: rule.action,
              targetPort: targetPortInfo,
            });
          }
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
            id: c.target_port.id,
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
