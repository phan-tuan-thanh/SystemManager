import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TopologyService } from '../topology.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

const mockServer = {
  id: 'srv-1',
  code: 'SRV01',
  name: 'App Server 01',
  hostname: 'srv01.local',
  purpose: 'APP_SERVER',
  status: 'ACTIVE',
  environment: 'DEV',
  infra_type: 'VIRTUAL_MACHINE',
  site: 'DC',
  description: null,
  app_deployments: [
    {
      id: 'dep-1',
      version: '1.0.0',
      status: 'RUNNING',
      environment: 'DEV',
      application: {
        id: 'app-1',
        code: 'APP01',
        name: 'Core Banking',
        version: '1.0',
        owner_team: 'Core Team',
        group: { name: 'Banking' },
      },
    },
  ],
  network_configs: [
    {
      id: 'net-1',
      interface: 'eth0',
      private_ip: '10.0.0.1',
      public_ip: null,
      domain: 'app01.internal',
    },
  ],
};

const mockConnection = {
  id: 'conn-1',
  source_app_id: 'app-1',
  target_app_id: 'app-2',
  connection_type: 'HTTPS',
  environment: 'DEV',
  description: 'API call',
  source_app: { id: 'app-1', name: 'Core Banking' },
  target_app: { id: 'app-2', name: 'Payment Service' },
};

const mockPrisma = {
  server: {
    findMany: vi.fn().mockResolvedValue([mockServer]),
  },
  appConnection: {
    findMany: vi.fn().mockResolvedValue([mockConnection]),
  },
};

describe('TopologyService', () => {
  let service: TopologyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopologyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TopologyService>(TopologyService);
    vi.clearAllMocks();
    mockPrisma.server.findMany.mockResolvedValue([mockServer]);
    mockPrisma.appConnection.findMany.mockResolvedValue([mockConnection]);
  });

  describe('getTopology', () => {
    it('should return servers and connections without environment filter', async () => {
      const result = await service.getTopology();

      expect(mockPrisma.server.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
      expect(result.servers).toHaveLength(1);
      expect(result.connections).toHaveLength(1);
    });

    it('should pass environment filter when provided', async () => {
      await service.getTopology('DEV');

      expect(mockPrisma.server.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, environment: 'DEV' },
        }),
      );
    });

    it('should map server fields correctly', async () => {
      const result = await service.getTopology();
      const server = result.servers[0];

      expect(server.id).toBe('srv-1');
      expect(server.name).toBe('App Server 01');
      expect(server.status).toBe('ACTIVE');
      expect(server.deployments).toHaveLength(1);
      expect(server.deployments[0].application.name).toBe('Core Banking');
      expect(server.networkConfigs[0].private_ip).toBe('10.0.0.1');
    });

    it('should map connection fields correctly', async () => {
      const result = await service.getTopology();
      const conn = result.connections[0];

      expect(conn.id).toBe('conn-1');
      expect(conn.sourceAppName).toBe('Core Banking');
      expect(conn.targetAppName).toBe('Payment Service');
      expect(conn.connectionType).toBe('HTTPS');
    });
  });

  describe('getAppDependency', () => {
    it('should return upstream and downstream connections', async () => {
      const upstreamConn = { ...mockConnection, target_app_id: 'app-1' };
      const downstreamConn = { ...mockConnection, source_app_id: 'app-1' };

      mockPrisma.appConnection.findMany
        .mockResolvedValueOnce([upstreamConn])
        .mockResolvedValueOnce([downstreamConn]);

      const result = await service.getAppDependency('app-1');

      expect(mockPrisma.appConnection.findMany).toHaveBeenCalledTimes(2);
      expect(result.upstream).toHaveLength(1);
      expect(result.downstream).toHaveLength(1);
    });

    it('should query upstream with target_app_id filter', async () => {
      mockPrisma.appConnection.findMany.mockResolvedValue([]);

      await service.getAppDependency('app-99');

      expect(mockPrisma.appConnection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { target_app_id: 'app-99', deletedAt: null },
        }),
      );
    });

    it('should query downstream with source_app_id filter', async () => {
      mockPrisma.appConnection.findMany.mockResolvedValue([]);

      await service.getAppDependency('app-99');

      expect(mockPrisma.appConnection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { source_app_id: 'app-99', deletedAt: null },
        }),
      );
    });
  });
});
