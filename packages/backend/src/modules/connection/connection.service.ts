import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { QueryConnectionDto } from './dto/query-connection.dto';

const APP_SELECT = { id: true, code: true, name: true, group: { select: { id: true, name: true } } };

export interface FirewallCoverageResult {
  connection_id: string;
  status: 'COVERED' | 'UNCOVERED' | 'NO_PORT' | 'UNKNOWN';
  covering_rules: { id: string; name: string; status: string; action: string }[];
}

function ipMatchesCidrOrExact(ip: string, cidrOrIp: string): boolean {
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
export class ConnectionService {
  constructor(private prisma: PrismaService) {}

  async list(query: QueryConnectionDto) {
    const where: any = { deleted_at: null };

    if (query.environment) where.environment = query.environment;
    if (query.source_app_id) where.source_app_id = query.source_app_id;
    if (query.target_app_id) where.target_app_id = query.target_app_id;
    if (query.connection_type) where.connection_type = query.connection_type;
    if (query.search) {
      where.OR = [
        { source_app: { name: { contains: query.search, mode: 'insensitive' } } },
        { target_app: { name: { contains: query.search, mode: 'insensitive' } } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { created_at: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.appConnection.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          source_app: { select: APP_SELECT },
          target_app: { select: APP_SELECT },
          target_port: { select: { id: true, port_number: true, protocol: true } },
        },
      }),
      this.prisma.appConnection.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const conn = await this.prisma.appConnection.findFirst({
      where: { id, deleted_at: null },
      include: {
        source_app: { select: APP_SELECT },
        target_app: { select: APP_SELECT },
        target_port: { select: { id: true, port_number: true, protocol: true } },
      },
    });
    if (!conn) throw new NotFoundException(`Connection ${id} not found`);
    return conn;
  }

  async create(dto: CreateConnectionDto) {
    if (dto.source_app_id === dto.target_app_id) {
      throw new BadRequestException('Source and target application cannot be the same');
    }

    const [source, target] = await Promise.all([
      this.prisma.application.findFirst({ where: { id: dto.source_app_id, deleted_at: null } }),
      this.prisma.application.findFirst({ where: { id: dto.target_app_id, deleted_at: null } }),
    ]);
    if (!source) throw new NotFoundException(`Source application ${dto.source_app_id} not found`);
    if (!target) throw new NotFoundException(`Target application ${dto.target_app_id} not found`);

    if (dto.target_port_id) {
      const port = await this.prisma.port.findFirst({ where: { id: dto.target_port_id, deleted_at: null } });
      if (!port) throw new NotFoundException(`Port ${dto.target_port_id} not found`);
      if (port.application_id !== target.id) {
        throw new BadRequestException(`Port ${dto.target_port_id} does not belong to target app ${target.id}`);
      }
    }

    return this.prisma.appConnection.create({
      data: dto as any,
      include: {
        source_app: { select: APP_SELECT },
        target_app: { select: APP_SELECT },
        target_port: { select: { id: true, port_number: true, protocol: true } },
      },
    });
  }

  async update(id: string, dto: UpdateConnectionDto) {
    const conn = await this.prisma.appConnection.findFirst({ where: { id, deleted_at: null } });
    if (!conn) throw new NotFoundException(`Connection ${id} not found`);

    const sourceId = dto.source_app_id ?? conn.source_app_id;
    const targetId = dto.target_app_id ?? conn.target_app_id;
    if (sourceId === targetId) {
      throw new BadRequestException('Source and target application cannot be the same');
    }

    if (dto.target_port_id) {
      const port = await this.prisma.port.findFirst({ where: { id: dto.target_port_id, deleted_at: null } });
      if (!port) throw new NotFoundException(`Port ${dto.target_port_id} not found`);
      if (port.application_id !== targetId) {
        throw new BadRequestException(`Port ${dto.target_port_id} does not belong to target app ${targetId}`);
      }
    }
    
    return this.prisma.appConnection.update({
      where: { id },
      data: dto as any,
      include: {
        source_app: { select: APP_SELECT },
        target_app: { select: APP_SELECT },
        target_port: { select: { id: true, port_number: true, protocol: true } },
      },
    });
  }

  async remove(id: string) {
    const conn = await this.prisma.appConnection.findFirst({ where: { id, deleted_at: null } });
    if (!conn) throw new NotFoundException(`Connection ${id} not found`);
    await this.prisma.appConnection.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /**
   * S25-01: Get firewall coverage status for a single AppConnection
   */
  async getFirewallCoverageStatus(connectionId: string): Promise<FirewallCoverageResult> {
    const conn = await this.prisma.appConnection.findFirst({
      where: { id: connectionId, deleted_at: null },
      include: {
        target_port: true,
        source_app: {
          include: {
            app_deployments: {
              where: { deleted_at: null },
              include: {
                server: {
                  include: {
                    network_configs: { where: { deleted_at: null } },
                  },
                },
              },
            },
          },
        },
        target_app: {
          include: {
            app_deployments: {
              where: { deleted_at: null },
              include: { ports: { where: { deleted_at: null } } },
            },
          },
        },
      },
    });

    if (!conn) throw new NotFoundException(`Connection ${connectionId} not found`);

    // Step 2: no target port → NO_PORT
    if (!conn.target_port_id) {
      return { connection_id: connectionId, status: 'NO_PORT', covering_rules: [] };
    }

    // Step 3: collect source IPs from all source-app server deployments
    const sourceIps: string[] = [];
    for (const dep of conn.source_app.app_deployments) {
      for (const nc of dep.server.network_configs) {
        if (nc.private_ip) sourceIps.push(nc.private_ip);
        if (nc.public_ip) sourceIps.push(nc.public_ip);
      }
    }

    // Step 4: find target server — deployment that owns the target_port
    let targetServerId: string | null = null;
    for (const dep of conn.target_app.app_deployments) {
      const hasPort = dep.ports.some((p) => p.id === conn.target_port_id);
      if (hasPort) {
        targetServerId = dep.server_id;
        break;
      }
    }

    // Step 5: no deployment found for the target port
    if (!targetServerId) {
      return { connection_id: connectionId, status: 'UNKNOWN', covering_rules: [] };
    }

    // Step 6: query firewall rules — exact port match + wildcard (null port) rules
    const [exactPortRules, wildcardRules] = await Promise.all([
      this.prisma.firewallRule.findMany({
        where: {
          destination_server_id: targetServerId,
          destination_port_id: conn.target_port_id!,
          action: 'ALLOW',
          status: 'ACTIVE',
          deleted_at: null,
        },
        include: {
          source_zone: { include: { ip_entries: { where: { deleted_at: null } } } },
        },
      }),
      this.prisma.firewallRule.findMany({
        where: {
          destination_server_id: targetServerId,
          destination_port_id: null,
          action: 'ALLOW',
          status: 'ACTIVE',
          deleted_at: null,
        },
        include: {
          source_zone: { include: { ip_entries: { where: { deleted_at: null } } } },
        },
      }),
    ]);

    const allRules = [...exactPortRules, ...wildcardRules];

    // Steps 7-8: match rules against source IPs
    const matchingRules: { id: string; name: string; status: string; action: string }[] = [];

    for (const rule of allRules) {
      let matched = false;

      if (rule.source_ip) {
        // Direct IP match
        matched = sourceIps.some((sip) => ipMatchesCidrOrExact(sip, rule.source_ip!));
      } else if (rule.source_zone) {
        // Zone IP match
        for (const entry of rule.source_zone.ip_entries) {
          if (sourceIps.some((sip) => ipMatchesCidrOrExact(sip, entry.ip_address))) {
            matched = true;
            break;
          }
        }
      } else {
        // No source restriction — rule applies to any source
        matched = true;
      }

      if (matched) {
        matchingRules.push({
          id: rule.id,
          name: rule.name,
          status: rule.status,
          action: rule.action,
        });
      }
    }

    return {
      connection_id: connectionId,
      status: matchingRules.length > 0 ? 'COVERED' : 'UNCOVERED',
      covering_rules: matchingRules,
    };
  }

  /**
   * S25-01: Get firewall coverage status for all connections in an environment (batch)
   */
  async getFirewallCoverageStatusBatch(
    environment: string,
  ): Promise<Record<string, FirewallCoverageResult>> {
    const connections = await this.prisma.appConnection.findMany({
      where: { environment: environment as any, deleted_at: null },
      select: { id: true },
    });

    const results = await Promise.all(
      connections.map((c) => this.getFirewallCoverageStatus(c.id)),
    );

    const record: Record<string, FirewallCoverageResult> = {};
    for (const r of results) {
      record[r.connection_id] = r;
    }
    return record;
  }

  /**
   * S7-03: Get upstream (dependencies) and downstream (dependents) for an app in an env
   */
  async getDependencies(applicationId: string, environment?: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, deleted_at: null },
    });
    if (!app) throw new NotFoundException(`Application ${applicationId} not found`);

    const envFilter = environment ? { environment } : {};

    const [upstream, downstream] = await Promise.all([
      // upstream: connections where THIS app is the target (sources depend on me)
      this.prisma.appConnection.findMany({
        where: { target_app_id: applicationId, deleted_at: null, ...envFilter },
        include: { source_app: { select: APP_SELECT } },
        orderBy: { created_at: 'asc' },
      }),
      // downstream: connections where THIS app is the source (I depend on targets)
      this.prisma.appConnection.findMany({
        where: { source_app_id: applicationId, deleted_at: null, ...envFilter },
        include: { target_app: { select: APP_SELECT } },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    return {
      application_id: applicationId,
      upstream: upstream.map((c) => ({
        connection_id: c.id,
        environment: c.environment,
        connection_type: c.connection_type,
        description: c.description,
        app: c.source_app,
      })),
      downstream: downstream.map((c) => ({
        connection_id: c.id,
        environment: c.environment,
        connection_type: c.connection_type,
        description: c.description,
        app: c.target_app,
      })),
    };
  }
}
