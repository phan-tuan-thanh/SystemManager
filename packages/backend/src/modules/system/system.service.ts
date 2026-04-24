import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TopologyService } from '../topology/topology.service';
import {
  DEMO_SERVERS, DEMO_HARDWARE, DEMO_NETWORK,
  DEMO_APP_GROUPS, DEMO_APPS, DEMO_SYSTEM_SOFTWARE,
  DEMO_DEPLOYMENTS, DEMO_CONNECTIONS, DEMO_DOC_TYPES,
} from './demo-data';

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    private topologyService: TopologyService,
  ) {}

  async getStatus() {
    const [
      moduleCount, groupCount, adminCount,
      serverCount, applicationCount, deploymentCount,
      connectionCount, infraSystemCount,
      serversByEnv, deploymentsByStatus,
    ] = await Promise.all([
      this.prisma.moduleConfig.count(),
      this.prisma.userGroup.count(),
      this.prisma.userRole.count({ where: { role: 'ADMIN' } }),
      this.prisma.server.count({ where: { deleted_at: null } }),
      this.prisma.application.count({ where: { deleted_at: null } }),
      this.prisma.appDeployment.count({ where: { deleted_at: null } }),
      this.prisma.appConnection.count({ where: { deleted_at: null } }),
      this.prisma.infraSystem.count({ where: { deleted_at: null } }),
      this.prisma.server.groupBy({ by: ['environment'], where: { deleted_at: null }, _count: true }),
      this.prisma.appDeployment.groupBy({ by: ['status'], where: { deleted_at: null }, _count: true }),
    ]);
    return {
      initialized: moduleCount > 0 && groupCount > 0,
      hasAdmin: adminCount > 0,
      moduleCount,
      groupCount,
      serverCount,
      applicationCount,
      deploymentCount,
      connectionCount,
      infraSystemCount,
      serversByEnv: serversByEnv.map((e) => ({ environment: e.environment, count: e._count })),
      deploymentsByStatus: deploymentsByStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }

  async globalSearch(q: string) {
    if (!q || q.trim().length < 2) return { servers: [], applications: [], networks: [] };
    const term = q.trim();
    const filter = { contains: term, mode: 'insensitive' as const };

    const [servers, applications, networks] = await Promise.all([
      this.prisma.server.findMany({
        where: {
          deleted_at: null,
          OR: [{ name: filter }, { code: filter }, { hostname: filter }],
        },
        select: { id: true, code: true, name: true, hostname: true, environment: true, status: true },
        take: 10,
      }),
      this.prisma.application.findMany({
        where: {
          deleted_at: null,
          OR: [{ name: filter }, { code: filter }],
        },
        select: { id: true, code: true, name: true },
        take: 10,
      }),
      this.prisma.networkConfig.findMany({
        where: {
          deleted_at: null,
          OR: [{ private_ip: filter }, { public_ip: filter }, { domain: filter }],
        },
        select: { id: true, private_ip: true, public_ip: true, domain: true, server: { select: { id: true, name: true } } },
        take: 10,
      }),
    ]);

    return {
      servers: servers.map((s) => ({ ...s, type: 'server', label: `${s.name} (${s.code})`, path: `/servers/${s.id}` })),
      applications: applications.map((a) => ({ ...a, type: 'application', label: `${a.name} (${a.code})`, path: `/applications/${a.id}` })),
      networks: networks.map((n) => ({
        ...n,
        type: 'network',
        label: [n.private_ip, n.public_ip, n.domain].filter(Boolean).join(' / '),
        path: `/servers/${n.server?.id}`,
      })),
    };
  }

  async initialize() {
    const modules = [
      { key: 'SERVER_MGMT',       name: 'Quản lý Server',                 type: 'CORE',     deps: [] },
      { key: 'HARDWARE_MGMT',     name: 'Quản lý Linh kiện',              type: 'CORE',     deps: ['SERVER_MGMT'] },
      { key: 'NETWORK_MGMT',      name: 'Quản lý Mạng',                   type: 'CORE',     deps: ['SERVER_MGMT'] },
      { key: 'APP_GROUP',         name: 'Nhóm ứng dụng',                  type: 'CORE',     deps: [] },
      { key: 'SOFTWARE_MGMT',     name: 'Quản lý Phần mềm & Ứng dụng',   type: 'CORE',     deps: ['APP_GROUP'] },
      { key: 'PORT_MGMT',         name: 'Quản lý Port',                   type: 'CORE',     deps: ['SOFTWARE_MGMT', 'SERVER_MGMT'] },
      { key: 'CONNECTION_MGMT',   name: 'Quản lý Kết nối',                type: 'CORE',     deps: ['SOFTWARE_MGMT'] },
      { key: 'AUDIT_LOG',         name: 'Audit Log',                      type: 'CORE',     deps: [] },
      { key: 'TOPOLOGY_2D',       name: 'Topology 2D',                    type: 'EXTENDED', deps: ['SERVER_MGMT', 'SOFTWARE_MGMT'] },
      { key: 'TOPOLOGY_3D',       name: 'Topology 3D',                    type: 'EXTENDED', deps: ['TOPOLOGY_2D'] },
      { key: 'REALTIME_STATUS',   name: 'Trạng thái Realtime',            type: 'EXTENDED', deps: ['TOPOLOGY_2D'] },
      { key: 'TOPOLOGY_SNAPSHOT', name: 'Topology Snapshot',              type: 'EXTENDED', deps: ['TOPOLOGY_2D', 'AUDIT_LOG'] },
      { key: 'CHANGESET',         name: 'ChangeSet Draft & Preview',      type: 'EXTENDED', deps: ['TOPOLOGY_2D', 'AUDIT_LOG'] },
      { key: 'DEPLOYMENT_DOCS',   name: 'Hồ sơ tài liệu triển khai',     type: 'EXTENDED', deps: ['SOFTWARE_MGMT'] },
      { key: 'CHANGE_HISTORY',    name: 'Lịch sử thay đổi',              type: 'EXTENDED', deps: ['AUDIT_LOG'] },
      { key: 'IMPORT_CSV',        name: 'Import CSV / Excel',             type: 'EXTENDED', deps: [] },
      { key: 'SSH_SYNC',          name: 'Sync SSH / Auto-discovery',      type: 'EXTENDED', deps: ['SERVER_MGMT'] },
      { key: 'ALERT',             name: 'Alert & Notification',           type: 'EXTENDED', deps: ['AUDIT_LOG'] },
    ];

    const groups = [
      { code: 'ADMIN_GRP', name: 'Quản trị hệ thống',    role: 'ADMIN',    desc: 'Toàn quyền hệ thống' },
      { code: 'PTUD',      name: 'Phát triển ứng dụng',  role: 'OPERATOR', desc: 'Quản lý ứng dụng, deployment, AppConnection' },
      { code: 'VH_APP',    name: 'Vận hành ứng dụng',    role: 'OPERATOR', desc: 'Theo dõi trạng thái, upload tài liệu triển khai' },
      { code: 'CSHT',      name: 'Cơ sở hạ tầng',        role: 'OPERATOR', desc: 'Quản lý server, hardware, network, port' },
      { code: 'PTNV',      name: 'Phân tích nghiệp vụ',  role: 'VIEWER',   desc: 'Xem topology, tra cứu, export báo cáo' },
    ];

    // Always upsert modules and groups — safe to call multiple times (idempotent).
    // This allows adding new modules in later sprints without requiring a full reset.
    await this.prisma.$transaction(async (tx) => {
      for (const m of modules) {
        await tx.moduleConfig.upsert({
          where: { module_key: m.key },
          update: {},
          create: {
            module_key: m.key,
            display_name: m.name,
            module_type: m.type as 'CORE' | 'EXTENDED',
            status: 'ENABLED',
            dependencies: m.deps,
          },
        });
      }
      for (const g of groups) {
        await tx.userGroup.upsert({
          where: { code: g.code },
          update: {},
          create: {
            code: g.code,
            name: g.name,
            description: g.desc,
            default_role: g.role as 'ADMIN' | 'OPERATOR' | 'VIEWER',
            status: 'ACTIVE',
          },
        });
      }
    });

    const status = await this.getStatus();
    return {
      message: status.initialized ? 'System initialized successfully' : 'System re-synced',
      created: { modules: modules.length, userGroups: groups.length },
    };
  }

  async seedDemoData() {
    const serverCount = await this.prisma.server.count();
    if (serverCount > 0) {
      throw new ConflictException('Demo data already exists');
    }

    // Doc types
    for (const d of DEMO_DOC_TYPES) {
      await this.prisma.deploymentDocType.upsert({
        where: { code: d.code },
        update: {},
        create: { code: d.code, name: d.name, description: d.description, sort_order: d.sort_order, required: d.required, environments: d.environments },
      });
    }

    // Servers + Hardware + Network
    const serverMap: Record<string, string> = {};
    for (const s of DEMO_SERVERS) {
      const server = await this.prisma.server.create({ data: s });
      serverMap[s.code] = server.id;
      for (const h of DEMO_HARDWARE[s.code] ?? []) {
        await this.prisma.hardwareComponent.create({ data: { server_id: server.id, ...h } });
      }
      for (const n of DEMO_NETWORK[s.code] ?? []) {
        await this.prisma.networkConfig.create({ data: { server_id: server.id, ...n } });
      }
    }

    // App Groups
    const groupMap: Record<string, string> = {};
    for (const g of DEMO_APP_GROUPS) {
      const group = await this.prisma.applicationGroup.upsert({
        where: { code: g.code }, update: {}, create: g,
      });
      groupMap[g.code] = group.id;
    }

    // System Software
    for (const sw of DEMO_SYSTEM_SOFTWARE) {
      await this.prisma.systemSoftware.create({
        data: { group_id: groupMap[sw.groupCode], name: sw.name, version: sw.version, sw_type: sw.sw_type, eol_date: sw.eol_date ?? undefined },
      });
    }

    // Applications
    const appMap: Record<string, string> = {};
    for (const a of DEMO_APPS) {
      const app = await this.prisma.application.upsert({
        where: { code: a.code },
        update: {},
        create: { group_id: groupMap[a.groupCode], code: a.code, name: a.name, version: a.version, description: a.description, owner_team: a.owner_team },
      });
      appMap[a.code] = app.id;
    }

    // Deployments + Ports
    for (const d of DEMO_DEPLOYMENTS) {
      const deployment = await this.prisma.appDeployment.create({
        data: {
          application_id: appMap[d.appCode],
          server_id: serverMap[d.serverCode],
          environment: d.environment,
          version: d.version,
          status: d.status,
          title: d.title,
          deployer: d.deployer,
          cmc_name: d.cmc_name,
          deployed_at: d.deployed_at,
        },
      });
      for (const p of d.ports) {
        await this.prisma.port.create({ data: { application_id: appMap[d.appCode], deployment_id: deployment.id, ...p } });
      }
    }

    // App Connections
    for (const c of DEMO_CONNECTIONS) {
      await this.prisma.appConnection.create({
        data: {
          source_app_id: appMap[c.sourceCode],
          target_app_id: appMap[c.targetCode],
          environment: c.environment,
          connection_type: c.type,
          description: c.description,
        },
      });
    }

    // Topology snapshots — capture initial state for each environment + all
    // Wrapped in try/catch so a snapshot failure doesn't abort the entire seed
    const snapshotEnvs: Array<string | undefined> = ['DEV', 'UAT', 'PROD', undefined];
    let topologySnapshotsCreated = 0;
    try {
      for (const env of snapshotEnvs) {
        const payload = await this.topologyService.getTopology(env);
        await this.prisma.topologySnapshot.create({
          data: {
            label: env
              ? `Demo snapshot — ${env} (initial)`
              : 'Demo snapshot — All environments (initial)',
            environment: env ?? null,
            payload: payload as any,
            created_by: null,
          },
        });
        topologySnapshotsCreated++;
      }
    } catch (err) {
      // Non-fatal: core demo data is already seeded; snapshots can be created manually
      console.warn('Warning: failed to create topology snapshots during seed', String(err));
    }

    return {
      message: 'Demo data seeded successfully',
      created: {
        servers: DEMO_SERVERS.length,
        applicationGroups: DEMO_APP_GROUPS.length,
        applications: DEMO_APPS.length,
        systemSoftware: DEMO_SYSTEM_SOFTWARE.length,
        deployments: DEMO_DEPLOYMENTS.length,
        connections: DEMO_CONNECTIONS.length,
        docTypes: DEMO_DOC_TYPES.length,
        topologySnapshots: topologySnapshotsCreated,
      },
    };
  }
}
