import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ApplicationService } from '../application.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../../change-history/change-history.service';

const mockPrisma = {
  application: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  applicationGroup: {
    findFirst: jest.fn(),
  },
  appDeployment: {
    findMany: jest.fn(),
  },
};

const mockChangeHistory = { record: jest.fn() };

describe('ApplicationService', () => {
  let service: ApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChangeHistoryService, useValue: mockChangeHistory },
      ],
    }).compile();

    service = module.get<ApplicationService>(ApplicationService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated applications', async () => {
      mockPrisma.application.findMany.mockResolvedValue([{ id: '1', code: 'APP1', name: 'App 1' }]);
      mockPrisma.application.count.mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('create', () => {
    it('should create application', async () => {
      mockPrisma.applicationGroup.findFirst.mockResolvedValue({ id: 'g1' });
      mockPrisma.application.findFirst.mockResolvedValue(null);
      mockPrisma.application.create.mockResolvedValue({ id: '1', code: 'APP1', name: 'App 1' });

      const result = await service.create({ group_id: 'g1', code: 'APP1', name: 'App 1' });
      expect(result.code).toBe('APP1');
    });

    it('should throw NotFoundException if group not found', async () => {
      mockPrisma.applicationGroup.findFirst.mockResolvedValue(null);
      await expect(service.create({ group_id: 'invalid', code: 'APP1', name: 'App 1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if code already exists', async () => {
      mockPrisma.applicationGroup.findFirst.mockResolvedValue({ id: 'g1' });
      mockPrisma.application.findFirst.mockResolvedValue({ id: '2', code: 'APP1' });

      await expect(service.create({ group_id: 'g1', code: 'APP1', name: 'App 1' })).rejects.toThrow(ConflictException);
    });
  });

  describe('whereRunning', () => {
    it('should return grouped deployments by environment', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.appDeployment.findMany.mockResolvedValue([
        { id: 'd1', environment: 'PROD', version: '1.0', server: { name: 'srv-01', environment: 'PROD' } },
      ]);

      const result = await service.whereRunning('1');
      expect(result.PROD).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should soft delete application', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.application.update.mockResolvedValue({ id: '1', deleted_at: new Date() });

      await service.remove('1');
      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deleted_at: expect.any(Date) }) }),
      );
    });
  });
});
