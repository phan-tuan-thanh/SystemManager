import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AppGroupService } from '../app-group.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

const mockPrisma = {
  applicationGroup: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('AppGroupService', () => {
  let service: AppGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppGroupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AppGroupService>(AppGroupService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated app groups', async () => {
      mockPrisma.applicationGroup.findMany.mockResolvedValue([{ id: '1', code: 'G1', name: 'Group 1' }]);
      mockPrisma.applicationGroup.count.mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any);
      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a new app group', async () => {
      mockPrisma.applicationGroup.findFirst.mockResolvedValue(null);
      mockPrisma.applicationGroup.create.mockResolvedValue({ id: '1', code: 'G1', name: 'Group 1' });

      const result = await service.create({ code: 'G1', name: 'Group 1' });
      expect(result.code).toBe('G1');
    });

    it('should throw ConflictException if code already exists', async () => {
      mockPrisma.applicationGroup.findFirst.mockResolvedValue({ id: '1', code: 'G1' });

      await expect(service.create({ code: 'G1', name: 'Group 1' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPrisma.applicationGroup.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete by setting deleted_at', async () => {
      mockPrisma.applicationGroup.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.applicationGroup.update.mockResolvedValue({ id: '1', deleted_at: new Date() });

      await service.remove('1');
      expect(mockPrisma.applicationGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deleted_at: expect.any(Date) }) }),
      );
    });
  });
});
