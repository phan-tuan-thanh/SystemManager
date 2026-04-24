import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { NetworkService } from '../network.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

const mockPrisma = {
  networkConfig: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  server: {
    findFirst: jest.fn(),
  },
};

describe('NetworkService', () => {
  let service: NetworkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NetworkService>(NetworkService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list', async () => {
      mockPrisma.networkConfig.findMany.mockResolvedValue([]);
      mockPrisma.networkConfig.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20, skip: 0, sortOrder: 'desc' } as any);
      expect(result.meta.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPrisma.networkConfig.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if server not found', async () => {
      mockPrisma.server.findFirst.mockResolvedValue(null);
      await expect(service.create({ server_id: 'bad-id', private_ip: '10.0.0.1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on IP conflict', async () => {
      mockPrisma.server.findFirst.mockResolvedValue({ id: 'srv-1', environment: 'DEV' });
      // IP conflict check returns existing record
      mockPrisma.networkConfig.findFirst.mockResolvedValue({
        id: 'conflict-id',
        server: { code: 'SRV-001', name: 'Server 1' },
      });
      await expect(
        service.create({ server_id: 'srv-1', private_ip: '10.0.0.1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create config when no conflict', async () => {
      const created = { id: 'new-id', server_id: 'srv-1', private_ip: '10.0.0.1', server: {} };
      mockPrisma.server.findFirst.mockResolvedValue({ id: 'srv-1', environment: 'DEV' });
      mockPrisma.networkConfig.findFirst.mockResolvedValue(null); // no conflict
      mockPrisma.networkConfig.create.mockResolvedValue(created);
      const result = await service.create({ server_id: 'srv-1', private_ip: '10.0.0.1' });
      expect(result).toEqual(created);
    });
  });

  describe('remove', () => {
    it('should soft delete', async () => {
      const config = { id: 'c1', server: {} };
      mockPrisma.networkConfig.findFirst.mockResolvedValue(config);
      mockPrisma.networkConfig.update.mockResolvedValue({});
      const result = await service.remove('c1');
      expect(result.message).toContain('deleted');
      expect(mockPrisma.networkConfig.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      });
    });
  });
});
