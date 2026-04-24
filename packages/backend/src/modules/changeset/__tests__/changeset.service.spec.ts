import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ChangeSetService } from '../changeset.service';
import { PreviewEngineService } from '../changeset.preview-engine';
import { PrismaService } from '../../../common/prisma/prisma.service';

const mockCreator = { id: 'user-1', full_name: 'Admin', email: 'admin@system.local' };
const mockChangeSet = {
  id: 'cs-1',
  title: 'Test ChangeSet',
  description: null,
  status: 'DRAFT',
  environment: 'DEV',
  created_by: 'user-1',
  applied_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  creator: mockCreator,
  items: [],
  _count: { items: 0 },
};

const mockPrisma = {
  changeSet: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  changeItem: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  topologySnapshot: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockPreviewEngine = {
  compute: jest.fn(),
};

describe('ChangeSetService', () => {
  let service: ChangeSetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeSetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PreviewEngineService, useValue: mockPreviewEngine },
      ],
    }).compile();

    service = module.get<ChangeSetService>(ChangeSetService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a DRAFT changeset', async () => {
      mockPrisma.changeSet.create.mockResolvedValue(mockChangeSet);
      const result = await service.create({ title: 'Test ChangeSet', environment: 'DEV' }, 'user-1');
      expect(mockPrisma.changeSet.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT', created_by: 'user-1' }) }),
      );
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('findOne', () => {
    it('should return changeset with items', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue(mockChangeSet);
      const result = await service.findOne('cs-1');
      expect(result.id).toBe('cs-1');
    });

    it('should throw NotFoundException for unknown id', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('discard', () => {
    it('should discard a DRAFT changeset', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue(mockChangeSet);
      mockPrisma.changeSet.update.mockResolvedValue({ ...mockChangeSet, status: 'DISCARDED' });
      const result = await service.discard('cs-1');
      expect(mockPrisma.changeSet.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'DISCARDED' } }),
      );
    });

    it('should throw if changeset is already APPLIED', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue({ ...mockChangeSet, status: 'APPLIED' });
      await expect(service.discard('cs-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addItem', () => {
    it('should add item to DRAFT changeset', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue(mockChangeSet);
      mockPrisma.changeItem.create.mockResolvedValue({ id: 'item-1', changeset_id: 'cs-1' });
      const dto = { resource_type: 'SERVER', action: 'DELETE', resource_id: 'srv-1' };
      await service.addItem('cs-1', dto as any);
      expect(mockPrisma.changeItem.create).toHaveBeenCalled();
    });

    it('should throw if changeset is not DRAFT', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue({ ...mockChangeSet, status: 'APPLIED' });
      await expect(service.addItem('cs-1', {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should remove item from DRAFT changeset', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue(mockChangeSet);
      mockPrisma.changeItem.findFirst.mockResolvedValue({ id: 'item-1', changeset_id: 'cs-1' });
      await service.removeItem('cs-1', 'item-1');
      expect(mockPrisma.changeItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
    });

    it('should throw NotFoundException if item not found', async () => {
      mockPrisma.changeSet.findUnique.mockResolvedValue(mockChangeSet);
      mockPrisma.changeItem.findFirst.mockResolvedValue(null);
      await expect(service.removeItem('cs-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list', async () => {
      mockPrisma.changeSet.findMany.mockResolvedValue([mockChangeSet]);
      mockPrisma.changeSet.count.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 20, skip: 0, sortOrder: 'desc' } as any);
      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should filter by status', async () => {
      mockPrisma.changeSet.findMany.mockResolvedValue([]);
      mockPrisma.changeSet.count.mockResolvedValue(0);
      await service.findAll({ page: 1, limit: 20, skip: 0, sortOrder: 'desc', status: 'APPLIED' } as any);
      expect(mockPrisma.changeSet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'APPLIED' }) }),
      );
    });
  });
});
