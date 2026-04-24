import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SnapshotService } from '../snapshot.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TopologyService } from '../../topology/topology.service';

const mockTopologyPayload = {
  servers: [{ id: 'srv-1', name: 'App Server', deployments: [], networkConfigs: [] }],
  connections: [],
};

const mockSnapshot = {
  id: 'snap-1',
  label: 'Test snapshot',
  environment: 'DEV',
  payload: mockTopologyPayload,
  created_by: 'user-1',
  created_at: new Date('2026-04-16T00:00:00Z'),
};

const mockPrisma = {
  topologySnapshot: {
    create: vi.fn().mockResolvedValue(mockSnapshot),
    findMany: vi.fn().mockResolvedValue([mockSnapshot]),
    count: vi.fn().mockResolvedValue(1),
    findUnique: vi.fn().mockResolvedValue(mockSnapshot),
  },
};

const mockTopologyService = {
  getTopology: vi.fn().mockResolvedValue(mockTopologyPayload),
};

describe('SnapshotService', () => {
  let service: SnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapshotService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TopologyService, useValue: mockTopologyService },
      ],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
    vi.clearAllMocks();
    mockPrisma.topologySnapshot.create.mockResolvedValue(mockSnapshot);
    mockPrisma.topologySnapshot.findMany.mockResolvedValue([mockSnapshot]);
    mockPrisma.topologySnapshot.count.mockResolvedValue(1);
    mockPrisma.topologySnapshot.findUnique.mockResolvedValue(mockSnapshot);
    mockTopologyService.getTopology.mockResolvedValue(mockTopologyPayload);
  });

  describe('create', () => {
    it('should capture topology and persist snapshot', async () => {
      const result = await service.create({ label: 'Test snapshot', environment: 'DEV' }, 'user-1');

      expect(mockTopologyService.getTopology).toHaveBeenCalledWith('DEV');
      expect(mockPrisma.topologySnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          label: 'Test snapshot',
          environment: 'DEV',
          created_by: 'user-1',
        }),
      });
      expect(result.id).toBe('snap-1');
    });

    it('should capture all environments when environment is omitted', async () => {
      await service.create({}, 'user-1');

      expect(mockTopologyService.getTopology).toHaveBeenCalledWith(undefined);
      expect(mockPrisma.topologySnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ environment: null }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated list without payload', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(mockPrisma.topologySnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          select: expect.objectContaining({ id: true, created_at: true }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by environment when provided', async () => {
      await service.findAll({ page: 1, limit: 20, environment: 'PROD' });

      expect(mockPrisma.topologySnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { environment: 'PROD' } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return snapshot by id', async () => {
      const result = await service.findOne('snap-1');
      expect(result.id).toBe('snap-1');
    });

    it('should throw NotFoundException when snapshot not found', async () => {
      mockPrisma.topologySnapshot.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
