import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HardwareService } from '../hardware.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../../change-history/change-history.service';

const mockPrisma = {
  hardwareComponent: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  server: {
    findFirst: jest.fn(),
  },
};

const mockChangeHistory = {
  record: jest.fn(),
  getHistory: jest.fn(),
};

describe('HardwareService', () => {
  let service: HardwareService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HardwareService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChangeHistoryService, useValue: mockChangeHistory },
      ],
    }).compile();

    service = module.get<HardwareService>(HardwareService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated hardware list', async () => {
      const items = [{ id: '1', type: 'CPU', model: 'Xeon' }];
      mockPrisma.hardwareComponent.findMany.mockResolvedValue(items);
      mockPrisma.hardwareComponent.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any);
      expect(result.data).toEqual(items);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by server_id', async () => {
      mockPrisma.hardwareComponent.findMany.mockResolvedValue([]);
      mockPrisma.hardwareComponent.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0, server_id: 'srv-1' } as any);

      expect(mockPrisma.hardwareComponent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ server_id: 'srv-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a hardware component', async () => {
      const component = { id: '1', type: 'CPU' };
      mockPrisma.hardwareComponent.findFirst.mockResolvedValue(component);

      const result = await service.findOne('1');
      expect(result).toEqual(component);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.hardwareComponent.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create hardware and record history', async () => {
      mockPrisma.server.findFirst.mockResolvedValue({ id: 'srv-1' });
      const component = { id: 'hw-1', type: 'CPU', server_id: 'srv-1' };
      mockPrisma.hardwareComponent.create.mockResolvedValue(component);
      mockChangeHistory.record.mockResolvedValue(undefined);

      const result = await service.create({ server_id: 'srv-1', type: 'CPU' }, 'user-1');
      expect(result).toEqual(component);
      expect(mockChangeHistory.record).toHaveBeenCalled();
    });

    it('should throw NotFoundException when server does not exist', async () => {
      mockPrisma.server.findFirst.mockResolvedValue(null);
      await expect(service.create({ server_id: 'bad-srv', type: 'CPU' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('attach', () => {
    it('should move hardware to a new server', async () => {
      const existing = { id: 'hw-1', server: { id: 'srv-1', code: 'SRV-1' } };
      const targetServer = { id: 'srv-2', code: 'SRV-2', name: 'Server 2' };
      mockPrisma.hardwareComponent.findFirst.mockResolvedValue(existing);
      mockPrisma.server.findFirst.mockResolvedValue(targetServer);
      const updated = { ...existing, server_id: 'srv-2' };
      mockPrisma.hardwareComponent.update.mockResolvedValue(updated);
      mockChangeHistory.record.mockResolvedValue(undefined);

      const result = await service.attach('hw-1', { server_id: 'srv-2' }, 'user-1');
      expect(result).toEqual(updated);
    });
  });

  describe('detach', () => {
    it('should soft-delete hardware and record DETACH history', async () => {
      const component = { id: 'hw-1', type: 'CPU' };
      mockPrisma.hardwareComponent.findFirst.mockResolvedValue(component);
      mockPrisma.hardwareComponent.update.mockResolvedValue({ ...component, deleted_at: new Date() });
      mockChangeHistory.record.mockResolvedValue(undefined);

      const result = await service.detach('hw-1', 'user-1');
      expect(result.message).toContain('detached');
      expect(mockChangeHistory.record).toHaveBeenCalledWith(
        expect.objectContaining({ snapshot: expect.objectContaining({ action: 'DETACH' }) }),
      );
    });
  });
});
