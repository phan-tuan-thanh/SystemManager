// ─── Servers ────────────────────────────────────────────────────

export const DEMO_SERVERS = [
  {
    code: 'SVR-DEV-APP-01',
    name: 'Dev App Server 01',
    hostname: 'dev-app-01.internal',
    purpose: 'APP_SERVER' as const,
    status: 'ACTIVE' as const,
    environment: 'DEV' as const,
    infra_type: 'VIRTUAL_MACHINE' as const,
    site: 'DC' as const,
    description: 'Server ứng dụng môi trường DEV',
  },
  {
    code: 'SVR-DEV-DB-01',
    name: 'Dev Database Server 01',
    hostname: 'dev-db-01.internal',
    purpose: 'DB_SERVER' as const,
    status: 'ACTIVE' as const,
    environment: 'DEV' as const,
    infra_type: 'VIRTUAL_MACHINE' as const,
    site: 'DC' as const,
    description: 'Server database môi trường DEV',
  },
  {
    code: 'SVR-UAT-APP-01',
    name: 'UAT App Server 01',
    hostname: 'uat-app-01.internal',
    purpose: 'APP_SERVER' as const,
    status: 'ACTIVE' as const,
    environment: 'UAT' as const,
    infra_type: 'VIRTUAL_MACHINE' as const,
    site: 'DC' as const,
    description: 'Server ứng dụng môi trường UAT',
  },
  {
    code: 'SVR-UAT-DB-01',
    name: 'UAT Database Server 01',
    hostname: 'uat-db-01.internal',
    purpose: 'DB_SERVER' as const,
    status: 'ACTIVE' as const,
    environment: 'UAT' as const,
    infra_type: 'VIRTUAL_MACHINE' as const,
    site: 'DC' as const,
    description: 'Server database môi trường UAT',
  },
  {
    code: 'SVR-PROD-APP-01',
    name: 'Production App Server 01',
    hostname: 'prod-app-01.internal',
    purpose: 'APP_SERVER' as const,
    status: 'ACTIVE' as const,
    environment: 'PROD' as const,
    infra_type: 'PHYSICAL_SERVER' as const,
    site: 'DC' as const,
    description: 'Server ứng dụng PROD chính (DC)',
  },
  {
    code: 'SVR-PROD-APP-02',
    name: 'Production App Server 02',
    hostname: 'prod-app-02.internal',
    purpose: 'APP_SERVER' as const,
    status: 'ACTIVE' as const,
    environment: 'PROD' as const,
    infra_type: 'PHYSICAL_SERVER' as const,
    site: 'DR' as const,
    description: 'Server ứng dụng PROD dự phòng (DR)',
  },
  {
    code: 'SVR-PROD-DB-01',
    name: 'Production Database Server 01',
    hostname: 'prod-db-01.internal',
    purpose: 'DB_SERVER' as const,
    status: 'ACTIVE' as const,
    environment: 'PROD' as const,
    infra_type: 'PHYSICAL_SERVER' as const,
    site: 'DC' as const,
    description: 'Server database PROD (Primary)',
  },
  {
    code: 'SVR-PROD-LB-01',
    name: 'Production Load Balancer',
    hostname: 'prod-lb-01.internal',
    purpose: 'LOAD_BALANCER' as const,
    status: 'ACTIVE' as const,
    environment: 'PROD' as const,
    infra_type: 'PHYSICAL_SERVER' as const,
    site: 'DC' as const,
    description: 'Load Balancer PROD — phân tải giữa APP-01 và APP-02',
  },
];

// ─── Hardware (per server code) ─────────────────────────────────

export const DEMO_HARDWARE: Record<
  string,
  { type: 'CPU' | 'RAM' | 'HDD' | 'SSD' | 'NETWORK_CARD'; model: string; manufacturer: string; specs: object }[]
> = {
  'SVR-DEV-APP-01': [
    { type: 'CPU', model: 'Intel Xeon E5-2680 v4', manufacturer: 'Intel', specs: { cores: 8, threads: 16, clock_ghz: 2.4 } },
    { type: 'RAM', model: 'DDR4 ECC', manufacturer: 'Samsung', specs: { capacity_gb: 16 } },
    { type: 'SSD', model: 'SATA SSD', manufacturer: 'Samsung', specs: { capacity_gb: 500 } },
  ],
  'SVR-DEV-DB-01': [
    { type: 'CPU', model: 'Intel Xeon E5-2680 v4', manufacturer: 'Intel', specs: { cores: 8, threads: 16, clock_ghz: 2.4 } },
    { type: 'RAM', model: 'DDR4 ECC', manufacturer: 'Samsung', specs: { capacity_gb: 32 } },
    { type: 'SSD', model: 'NVMe SSD', manufacturer: 'Samsung 970 Pro', specs: { capacity_gb: 1000 } },
  ],
  'SVR-UAT-APP-01': [
    { type: 'CPU', model: 'Intel Xeon E5-2690 v4', manufacturer: 'Intel', specs: { cores: 14, threads: 28, clock_ghz: 2.6 } },
    { type: 'RAM', model: 'DDR4 ECC', manufacturer: 'SK Hynix', specs: { capacity_gb: 32 } },
    { type: 'SSD', model: 'SATA SSD', manufacturer: 'Samsung', specs: { capacity_gb: 500 } },
  ],
  'SVR-UAT-DB-01': [
    { type: 'CPU', model: 'Intel Xeon E5-2690 v4', manufacturer: 'Intel', specs: { cores: 14, threads: 28, clock_ghz: 2.6 } },
    { type: 'RAM', model: 'DDR4 ECC', manufacturer: 'SK Hynix', specs: { capacity_gb: 64 } },
    { type: 'SSD', model: 'NVMe SSD', manufacturer: 'Samsung 970 Pro', specs: { capacity_gb: 2000 } },
  ],
  'SVR-PROD-APP-01': [
    { type: 'CPU', model: 'Intel Xeon Gold 6342', manufacturer: 'Intel', specs: { cores: 24, threads: 48, clock_ghz: 2.8 } },
    { type: 'RAM', model: 'DDR4 ECC', manufacturer: 'Samsung', specs: { capacity_gb: 128 } },
    { type: 'SSD', model: 'NVMe SSD U.2', manufacturer: 'Intel Optane', specs: { capacity_gb: 1000 } },
    { type: 'NETWORK_CARD', model: '10GbE Dual Port', manufacturer: 'Intel X550', specs: { speed_gbps: 10 } },
  ],
  'SVR-PROD-APP-02': [
    { type: 'CPU', model: 'Intel Xeon Gold 6342', manufacturer: 'Intel', specs: { cores: 24, threads: 48, clock_ghz: 2.8 } },
    { type: 'RAM', model: 'DDR4 ECC', manufacturer: 'Samsung', specs: { capacity_gb: 128 } },
    { type: 'SSD', model: 'NVMe SSD U.2', manufacturer: 'Intel Optane', specs: { capacity_gb: 1000 } },
    { type: 'NETWORK_CARD', model: '10GbE Dual Port', manufacturer: 'Intel X550', specs: { speed_gbps: 10 } },
  ],
  'SVR-PROD-DB-01': [
    { type: 'CPU', model: 'AMD EPYC 7543', manufacturer: 'AMD', specs: { cores: 32, threads: 64, clock_ghz: 2.8 } },
    { type: 'RAM', model: 'DDR4 ECC Reg', manufacturer: 'Micron', specs: { capacity_gb: 512 } },
    { type: 'SSD', model: 'NVMe SSD U.2', manufacturer: 'Samsung PM9A3', specs: { capacity_gb: 4000 } },
    { type: 'SSD', model: 'NVMe SSD U.2 (Replica)', manufacturer: 'Samsung PM9A3', specs: { capacity_gb: 4000 } },
    { type: 'NETWORK_CARD', model: '25GbE Dual Port', manufacturer: 'Mellanox ConnectX-5', specs: { speed_gbps: 25 } },
  ],
  'SVR-PROD-LB-01': [
    { type: 'CPU', model: 'Intel Xeon Silver 4314', manufacturer: 'Intel', specs: { cores: 16, threads: 32, clock_ghz: 2.4 } },
    { type: 'RAM', model: 'DDR4 ECC', manufacturer: 'Samsung', specs: { capacity_gb: 64 } },
    { type: 'SSD', model: 'SATA SSD', manufacturer: 'Samsung', specs: { capacity_gb: 240 } },
    { type: 'NETWORK_CARD', model: '10GbE Quad Port', manufacturer: 'Intel X710', specs: { speed_gbps: 10 } },
  ],
};

// ─── Network (per server code) ──────────────────────────────────

export const DEMO_NETWORK: Record<
  string,
  { interface: string; private_ip: string; public_ip?: string; domain?: string; subnet: string; gateway: string; dns: string[] }[]
> = {
  'SVR-DEV-APP-01':  [{ interface: 'eth0', private_ip: '10.0.1.10', subnet: '10.0.1.0/24', gateway: '10.0.1.1', dns: ['10.0.0.1', '8.8.8.8'] }],
  'SVR-DEV-DB-01':   [{ interface: 'eth0', private_ip: '10.0.1.20', subnet: '10.0.1.0/24', gateway: '10.0.1.1', dns: ['10.0.0.1', '8.8.8.8'] }],
  'SVR-UAT-APP-01':  [{ interface: 'eth0', private_ip: '10.0.2.10', subnet: '10.0.2.0/24', gateway: '10.0.2.1', dns: ['10.0.0.1', '8.8.8.8'] }],
  'SVR-UAT-DB-01':   [{ interface: 'eth0', private_ip: '10.0.2.20', subnet: '10.0.2.0/24', gateway: '10.0.2.1', dns: ['10.0.0.1', '8.8.8.8'] }],
  'SVR-PROD-APP-01': [{ interface: 'eth0', private_ip: '10.0.3.10', public_ip: '203.0.113.10', domain: 'app01.company.vn', subnet: '10.0.3.0/24', gateway: '10.0.3.1', dns: ['10.0.0.1', '1.1.1.1'] }],
  'SVR-PROD-APP-02': [{ interface: 'eth0', private_ip: '10.0.3.11', public_ip: '203.0.113.11', domain: 'app02.company.vn', subnet: '10.0.3.0/24', gateway: '10.0.3.1', dns: ['10.0.0.1', '1.1.1.1'] }],
  'SVR-PROD-DB-01':  [{ interface: 'eth0', private_ip: '10.0.3.20', subnet: '10.0.3.0/24', gateway: '10.0.3.1', dns: ['10.0.0.1'] }],
  'SVR-PROD-LB-01':  [{ interface: 'eth0', private_ip: '10.0.3.5', public_ip: '203.0.113.5', domain: 'api.company.vn', subnet: '10.0.3.0/24', gateway: '10.0.3.1', dns: ['10.0.0.1', '1.1.1.1'] }],
};

// ─── Application Groups ─────────────────────────────────────────

export const DEMO_APP_GROUPS = [
  { code: 'GRP-CORE',    name: 'Nghiệp vụ lõi',            description: 'Các ứng dụng nghiệp vụ cốt lõi của tổ chức' },
  { code: 'GRP-GATEWAY', name: 'API Gateway & Integration', description: 'Cổng API và tích hợp hệ thống' },
  { code: 'GRP-INFRA',   name: 'Hạ tầng phần mềm',          description: 'OS, runtime, middleware, web server' },
];

// ─── Applications ───────────────────────────────────────────────

export const DEMO_APPS = [
  { groupCode: 'GRP-CORE',    code: 'APP-CORE-BANKING', name: 'Core Banking System',    version: '3.5.2', description: 'Hệ thống ngân hàng lõi — xử lý giao dịch, tài khoản, sản phẩm', owner_team: 'PTUD' },
  { groupCode: 'GRP-CORE',    code: 'APP-PAYMENT',      name: 'Payment Gateway Service', version: '2.1.0', description: 'Dịch vụ xử lý thanh toán, kết nối cổng thanh toán quốc tế',      owner_team: 'PTUD' },
  { groupCode: 'GRP-GATEWAY', code: 'APP-API-GW',       name: 'API Gateway',             version: '1.8.3', description: 'Cổng API trung tâm — rate limiting, auth, routing',               owner_team: 'CSHT' },
  { groupCode: 'GRP-GATEWAY', code: 'APP-ADMIN',        name: 'Admin Portal',            version: '1.2.0', description: 'Giao diện quản trị nội bộ dành cho vận hành',                    owner_team: 'VH_APP' },
];

// ─── System Software ────────────────────────────────────────────

export const DEMO_SYSTEM_SOFTWARE = [
  { groupCode: 'GRP-INFRA', name: 'Ubuntu Server 22.04 LTS', version: '22.04.3', sw_type: 'Operating System', eol_date: new Date('2027-04-30') },
  { groupCode: 'GRP-INFRA', name: 'OpenJDK 17',              version: '17.0.9',  sw_type: 'Runtime',          eol_date: new Date('2029-09-30') },
  { groupCode: 'GRP-INFRA', name: 'Nginx',                   version: '1.24.0',  sw_type: 'Web Server',       eol_date: null },
  { groupCode: 'GRP-INFRA', name: 'PostgreSQL',              version: '15.4',    sw_type: 'Database',         eol_date: new Date('2027-11-30') },
  { groupCode: 'GRP-INFRA', name: 'Redis',                   version: '7.2.3',   sw_type: 'Cache',            eol_date: null },
];

// ─── Deployments ─────────────────────────────────────────────────

export const DEMO_DEPLOYMENTS = [
  {
    appCode: 'APP-CORE-BANKING', serverCode: 'SVR-DEV-APP-01', environment: 'DEV' as const,
    version: '3.5.2', status: 'RUNNING' as const,
    title: 'Core Banking v3.5.2 — DEV', deployer: 'Nguyễn Văn A', cmc_name: undefined,
    deployed_at: new Date('2026-03-10'),
    ports: [{ port_number: 8080, protocol: 'TCP', service_name: 'HTTP API' }],
  },
  {
    appCode: 'APP-CORE-BANKING', serverCode: 'SVR-UAT-APP-01', environment: 'UAT' as const,
    version: '3.5.1', status: 'RUNNING' as const,
    title: 'Core Banking v3.5.1 — UAT', deployer: 'Trần Thị B', cmc_name: 'CMC-2026-03-001',
    deployed_at: new Date('2026-03-01'),
    ports: [{ port_number: 8080, protocol: 'TCP', service_name: 'HTTP API' }],
  },
  {
    appCode: 'APP-CORE-BANKING', serverCode: 'SVR-PROD-APP-01', environment: 'PROD' as const,
    version: '3.5.0', status: 'RUNNING' as const,
    title: 'Core Banking v3.5.0 — PROD', deployer: 'Lê Văn C', cmc_name: 'CMC-2026-02-005',
    deployed_at: new Date('2026-02-15'),
    ports: [{ port_number: 8080, protocol: 'TCP', service_name: 'HTTP API' }],
  },
  {
    appCode: 'APP-CORE-BANKING', serverCode: 'SVR-PROD-APP-02', environment: 'PROD' as const,
    version: '3.5.0', status: 'RUNNING' as const,
    title: 'Core Banking v3.5.0 — PROD DR', deployer: 'Lê Văn C', cmc_name: 'CMC-2026-02-005',
    deployed_at: new Date('2026-02-15'),
    ports: [{ port_number: 8080, protocol: 'TCP', service_name: 'HTTP API' }],
  },
  {
    appCode: 'APP-PAYMENT', serverCode: 'SVR-DEV-APP-01', environment: 'DEV' as const,
    version: '2.1.0', status: 'RUNNING' as const,
    title: 'Payment Gateway v2.1.0 — DEV', deployer: 'Phạm Thị D', cmc_name: undefined,
    deployed_at: new Date('2026-03-15'),
    ports: [{ port_number: 8090, protocol: 'TCP', service_name: 'Payment API' }],
  },
  {
    appCode: 'APP-PAYMENT', serverCode: 'SVR-UAT-APP-01', environment: 'UAT' as const,
    version: '2.0.5', status: 'RUNNING' as const,
    title: 'Payment Gateway v2.0.5 — UAT', deployer: 'Phạm Thị D', cmc_name: 'CMC-2026-03-002',
    deployed_at: new Date('2026-03-05'),
    ports: [{ port_number: 8090, protocol: 'TCP', service_name: 'Payment API' }],
  },
  {
    appCode: 'APP-PAYMENT', serverCode: 'SVR-PROD-APP-01', environment: 'PROD' as const,
    version: '2.0.3', status: 'RUNNING' as const,
    title: 'Payment Gateway v2.0.3 — PROD', deployer: 'Hoàng Văn E', cmc_name: 'CMC-2026-01-010',
    deployed_at: new Date('2026-01-20'),
    ports: [{ port_number: 8090, protocol: 'TCP', service_name: 'Payment API' }],
  },
  {
    appCode: 'APP-API-GW', serverCode: 'SVR-DEV-APP-01', environment: 'DEV' as const,
    version: '1.8.3', status: 'RUNNING' as const,
    title: 'API Gateway v1.8.3 — DEV', deployer: 'Nguyễn Thị F', cmc_name: undefined,
    deployed_at: new Date('2026-03-20'),
    ports: [
      { port_number: 80,  protocol: 'TCP', service_name: 'HTTP' },
      { port_number: 443, protocol: 'TCP', service_name: 'HTTPS' },
    ],
  },
  {
    appCode: 'APP-API-GW', serverCode: 'SVR-PROD-LB-01', environment: 'PROD' as const,
    version: '1.8.2', status: 'RUNNING' as const,
    title: 'API Gateway v1.8.2 — PROD', deployer: 'Vũ Văn G', cmc_name: 'CMC-2026-02-001',
    deployed_at: new Date('2026-02-01'),
    ports: [
      { port_number: 80,  protocol: 'TCP', service_name: 'HTTP' },
      { port_number: 443, protocol: 'TCP', service_name: 'HTTPS' },
    ],
  },
  {
    appCode: 'APP-ADMIN', serverCode: 'SVR-DEV-APP-01', environment: 'DEV' as const,
    version: '1.2.0', status: 'RUNNING' as const,
    title: 'Admin Portal v1.2.0 — DEV', deployer: 'Đỗ Thị H', cmc_name: undefined,
    deployed_at: new Date('2026-03-25'),
    ports: [{ port_number: 3001, protocol: 'TCP', service_name: 'Web UI' }],
  },
];

// ─── AppConnections ──────────────────────────────────────────────
// Covers DEV / UAT / PROD with varied protocol types for topology demo

export const DEMO_CONNECTIONS = [
  // ── PROD ──────────────────────────────────────────────────────
  {
    sourceCode: 'APP-API-GW', targetCode: 'APP-CORE-BANKING',
    environment: 'PROD' as const, type: 'HTTPS' as const,
    description: 'API Gateway → Core Banking (HTTPS, TLS 1.3)',
  },
  {
    sourceCode: 'APP-API-GW', targetCode: 'APP-PAYMENT',
    environment: 'PROD' as const, type: 'HTTPS' as const,
    description: 'API Gateway → Payment Service (HTTPS)',
  },
  {
    sourceCode: 'APP-CORE-BANKING', targetCode: 'APP-PAYMENT',
    environment: 'PROD' as const, type: 'HTTP' as const,
    description: 'Core Banking → Payment: gọi nội bộ xử lý giao dịch',
  },
  {
    sourceCode: 'APP-ADMIN', targetCode: 'APP-API-GW',
    environment: 'PROD' as const, type: 'HTTPS' as const,
    description: 'Admin Portal → API Gateway (management calls)',
  },
  {
    sourceCode: 'APP-CORE-BANKING', targetCode: 'APP-ADMIN',
    environment: 'PROD' as const, type: 'GRPC' as const,
    description: 'Core Banking → Admin Portal: gRPC internal reporting',
  },

  // ── UAT ───────────────────────────────────────────────────────
  {
    sourceCode: 'APP-API-GW', targetCode: 'APP-CORE-BANKING',
    environment: 'UAT' as const, type: 'HTTPS' as const,
    description: 'API Gateway → Core Banking (UAT)',
  },
  {
    sourceCode: 'APP-API-GW', targetCode: 'APP-PAYMENT',
    environment: 'UAT' as const, type: 'HTTPS' as const,
    description: 'API Gateway → Payment (UAT)',
  },
  {
    sourceCode: 'APP-CORE-BANKING', targetCode: 'APP-PAYMENT',
    environment: 'UAT' as const, type: 'HTTP' as const,
    description: 'Core Banking → Payment nội bộ (UAT)',
  },

  // ── DEV ───────────────────────────────────────────────────────
  {
    sourceCode: 'APP-API-GW', targetCode: 'APP-CORE-BANKING',
    environment: 'DEV' as const, type: 'HTTP' as const,
    description: 'API Gateway → Core Banking (DEV, HTTP không TLS)',
  },
  {
    sourceCode: 'APP-API-GW', targetCode: 'APP-PAYMENT',
    environment: 'DEV' as const, type: 'HTTP' as const,
    description: 'API Gateway → Payment (DEV)',
  },
  {
    sourceCode: 'APP-CORE-BANKING', targetCode: 'APP-PAYMENT',
    environment: 'DEV' as const, type: 'HTTP' as const,
    description: 'Core Banking → Payment nội bộ (DEV)',
  },
  {
    sourceCode: 'APP-ADMIN', targetCode: 'APP-API-GW',
    environment: 'DEV' as const, type: 'HTTP' as const,
    description: 'Admin Portal → API Gateway (DEV)',
  },
  {
    sourceCode: 'APP-CORE-BANKING', targetCode: 'APP-ADMIN',
    environment: 'DEV' as const, type: 'GRPC' as const,
    description: 'Core Banking → Admin Portal: gRPC (DEV)',
  },
];

// ─── DeploymentDocTypes ──────────────────────────────────────────

export const DEMO_DOC_TYPES = [
  { code: 'DEPLOY_PLAN',    name: 'Kế hoạch triển khai',  description: 'Tài liệu mô tả chi tiết kế hoạch và các bước triển khai', sort_order: 1, required: true,  environments: ['PROD', 'UAT'] },
  { code: 'TEST_REPORT',    name: 'Báo cáo kiểm thử',     description: 'Kết quả kiểm thử chức năng, hiệu năng trước khi go-live',  sort_order: 2, required: true,  environments: ['PROD', 'UAT'] },
  { code: 'ROLLBACK_PLAN',  name: 'Phương án rollback',   description: 'Các bước khôi phục hệ thống khi triển khai thất bại',      sort_order: 3, required: true,  environments: ['PROD'] },
  { code: 'APPROVE_LETTER', name: 'Công văn phê duyệt',   description: 'Văn bản phê duyệt từ cấp có thẩm quyền',                   sort_order: 4, required: true,  environments: ['PROD'] },
  { code: 'ARCH_DIAGRAM',   name: 'Sơ đồ kiến trúc',      description: 'Kiến trúc hệ thống, luồng dữ liệu',                        sort_order: 5, required: false, environments: [] },
];
