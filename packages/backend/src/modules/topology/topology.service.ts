import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TopologyData, DependencyData, ServerNode, ConnectionEdge } from './topology.types';

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

    return { servers: serverNodes, connections: connectionEdges };
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
