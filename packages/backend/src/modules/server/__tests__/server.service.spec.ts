import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ServerService } from '../server.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../../change-history/change-history.service';

const mockPrisma = {
  server: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

const mockChangeHistory = {
  record: jest.fn(),
  getHistory: jest.fn(),
};

describe('ServerService', () => {
  let service: ServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChangeHistoryService, useValue: mockChangeHistory },
      ],
    }).compile();

    service = module.get<ServerService>(ServerService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated server list', async () => {
      const servers = [{ id: '1', name: 'Server 1', code: 'SRV-001' }];
      mockPrisma.server.findMany.mockResolvedValue(servers);
      mockPrisma.server.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any);

      expect(result.data).toEqual(servers);
      expect(result.meta.total).toBe(1);
    });

    it('should apply environment filter', async () => {
      mockPrisma.server.findMany.mockResolvedValue([]);
      mockPrisma.server.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0, environment: 'PROD' } as any);

      expect(mockPrisma.server.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ environment: 'PROD' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return server with relations', async () => {
      const server = { id: '1', name: 'S1', hardware_components: [], network_configs: [], app_deployments: [] };
      mockPrisma.server.findFirst.mockResolvedValue(server);

      const result = await service.findOne('1');
      expect(result).toEqual(server);
    });

    it('should throw NotFoundException when server not found', async () => {
      mockPrisma.server.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a server and record change history', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);
      const server = { id: '1', code: 'SRV-001', name: 'Test' };
      mockPrisma.server.create.mockResolvedValue(server);
      mockChangeHistory.record.mockResolvedValue(undefined);

      const result = await service.create(
        { code: 'SRV-001', name: 'Test', hostname: 'test.local', environment: 'DEV' },
        'user-1',
      );

      expect(result).toEqual(server);
      expect(mockChangeHistory.record).toHaveBeenCalledWith(
        expect.objectContaining({ resourceType: 'Server', resourceId: '1' }),
      );
    });

    it('should throw ConflictException when code already exists', async () => {
      mockPrisma.server.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ code: 'SRV-001', name: 'Test', hostname: 'test', environment: 'DEV' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update server and record change history', async () => {
      const existing = { id: '1', name: 'Old', hardware_components: [], network_configs: [], app_deployments: [] };
      const updated = { id: '1', name: 'New' };
      mockPrisma.server.findFirst.mockResolvedValue(existing);
      mockPrisma.server.update.mockResolvedValue(updated);
      mockChangeHistory.record.mockResolvedValue(undefined);

      const result = await service.update('1', { name: 'New' }, 'user-1');

      expect(result).toEqual(updated);
      expect(mockChangeHistory.record).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete server', async () => {
      const server = { id: '1', hardware_components: [], network_configs: [], app_deployments: [] };
      mockPrisma.server.findFirst.mockResolvedValue(server);
      mockPrisma.server.update.mockResolvedValue({ ...server, deleted_at: new Date() });
      mockChangeHistory.record.mockResolvedValue(undefined);

      const result = await service.remove('1', 'user-1');
      expect(result.message).toBe('Server deleted successfully');
      expect(mockPrisma.server.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });
});
