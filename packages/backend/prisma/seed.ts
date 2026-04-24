import { PrismaClient, ModuleType, ModuleStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Admin user is created on first login — no pre-seeded credentials needed.

  // Module configs
  const modules = [
    { key: 'SERVER_MGMT', name: 'Quản lý Server', type: ModuleType.CORE, deps: [] },
    { key: 'HARDWARE_MGMT', name: 'Quản lý Linh kiện', type: ModuleType.CORE, deps: ['SERVER_MGMT'] },
    { key: 'NETWORK_MGMT', name: 'Quản lý Mạng', type: ModuleType.CORE, deps: ['SERVER_MGMT'] },
    { key: 'APP_GROUP', name: 'Nhóm ứng dụng', type: ModuleType.CORE, deps: [] },
    { key: 'SOFTWARE_MGMT', name: 'Quản lý Phần mềm & Ứng dụng', type: ModuleType.CORE, deps: ['APP_GROUP'] },
    { key: 'PORT_MGMT',       name: 'Quản lý Port',        type: ModuleType.CORE, deps: ['SOFTWARE_MGMT', 'SERVER_MGMT'] },
    { key: 'CONNECTION_MGMT', name: 'Quản lý Kết nối',     type: ModuleType.CORE, deps: ['SOFTWARE_MGMT'] },
    { key: 'AUDIT_LOG',       name: 'Audit Log',            type: ModuleType.CORE, deps: [] },
    { key: 'INFRA_SYSTEM', name: 'Hệ thống & Import CSV', type: ModuleType.EXTENDED, deps: ['SERVER_MGMT', 'SOFTWARE_MGMT'] },
    { key: 'TOPOLOGY_2D', name: 'Topology 2D', type: ModuleType.EXTENDED, deps: ['SERVER_MGMT', 'SOFTWARE_MGMT'] },
    { key: 'TOPOLOGY_3D', name: 'Topology 3D', type: ModuleType.EXTENDED, deps: ['TOPOLOGY_2D'] },
    { key: 'REALTIME_STATUS', name: 'Trạng thái Realtime', type: ModuleType.EXTENDED, deps: ['TOPOLOGY_2D'] },
    { key: 'TOPOLOGY_SNAPSHOT', name: 'Topology Snapshot', type: ModuleType.EXTENDED, deps: ['TOPOLOGY_2D', 'AUDIT_LOG'] },
    { key: 'CHANGESET', name: 'ChangeSet Draft & Preview', type: ModuleType.EXTENDED, deps: ['TOPOLOGY_2D', 'AUDIT_LOG'] },
    { key: 'DEPLOYMENT_DOCS', name: 'Hồ sơ tài liệu triển khai', type: ModuleType.EXTENDED, deps: ['SOFTWARE_MGMT'] },
    { key: 'CHANGE_HISTORY', name: 'Lịch sử thay đổi', type: ModuleType.EXTENDED, deps: ['AUDIT_LOG'] },
    { key: 'IMPORT_CSV', name: 'Import CSV / Excel', type: ModuleType.EXTENDED, deps: [] },
    { key: 'SSH_SYNC', name: 'Sync SSH / Auto-discovery', type: ModuleType.EXTENDED, deps: ['SERVER_MGMT'] },
    { key: 'ALERT', name: 'Alert & Notification', type: ModuleType.EXTENDED, deps: ['AUDIT_LOG'] },
  ];

  for (const m of modules) {
    await prisma.moduleConfig.upsert({
      where: { module_key: m.key },
      update: {},
      create: {
        module_key: m.key,
        display_name: m.name,
        module_type: m.type,
        status: ModuleStatus.ENABLED,
        dependencies: m.deps,
      },
    });
  }
  console.log(`Seeded ${modules.length} module configs`);

  // Default user groups
  const groups = [
    { code: 'ADMIN_GRP', name: 'Quản trị hệ thống', role: Role.ADMIN, desc: 'Toàn quyền hệ thống' },
    { code: 'PTUD', name: 'Phát triển ứng dụng', role: Role.OPERATOR, desc: 'Quản lý ứng dụng, deployment' },
    { code: 'VH_APP', name: 'Vận hành ứng dụng', role: Role.OPERATOR, desc: 'Theo dõi trạng thái, upload tài liệu' },
    { code: 'CSHT', name: 'Cơ sở hạ tầng', role: Role.OPERATOR, desc: 'Quản lý server, hardware, network' },
    { code: 'PTNV', name: 'Phân tích nghiệp vụ', role: Role.VIEWER, desc: 'Xem topology, tra cứu, export' },
  ];

  for (const g of groups) {
    await prisma.userGroup.upsert({
      where: { code: g.code },
      update: {},
      create: {
        code: g.code,
        name: g.name,
        description: g.desc,
        default_role: g.role,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`Seeded ${groups.length} user groups`);

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
