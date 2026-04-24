import { Test } from '@nestjs/testing';
import { ConnectionService } from '../connection.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  appConnection: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  application: {
    findFirst: jest.fn(),
  },
};

describe('ConnectionService', () => {
  let service: ConnectionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConnectionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ConnectionService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if source === target', async () => {
      await expect(
        service.create({
          source_app_id: 'same-id',
          target_app_id: 'same-id',
          environment: 'DEV',
          connection_type: 'HTTPS',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if source app not found', async () => {
      mockPrisma.application.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'target-id' });

      await expect(
        service.create({
          source_app_id: 'src-id',
          target_app_id: 'tgt-id',
          environment: 'DEV',
          connection_type: 'HTTPS',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create connection successfully', async () => {
      mockPrisma.application.findFirst
        .mockResolvedValueOnce({ id: 'src-id' })
        .mockResolvedValueOnce({ id: 'tgt-id' });
      const created = { id: 'conn-1', source_app_id: 'src-id', target_app_id: 'tgt-id' };
      mockPrisma.appConnection.create.mockResolvedValue(created);

      const result = await service.create({
        source_app_id: 'src-id',
        target_app_id: 'tgt-id',
        environment: 'DEV',
        connection_type: 'HTTPS',
      });
      expect(result).toEqual(created);
    });
  });

  describe('remove', () => {
    it('should soft-delete connection', async () => {
      mockPrisma.appConnection.findFirst.mockResolvedValue({ id: 'conn-1' });
      mockPrisma.appConnection.update.mockResolvedValue({});
      await service.remove('conn-1');
      expect(mockPrisma.appConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if connection not found', async () => {
      mockPrisma.appConnection.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDependencies', () => {
    it('should throw NotFoundException if app not found', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null);
      await expect(service.getDependencies('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should return upstream and downstream', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 'app-1' });
      mockPrisma.appConnection.findMany
        .mockResolvedValueOnce([{ id: 'c1', source_app: { id: 'src' }, environment: 'PROD', connection_type: 'HTTPS', description: null }])
        .mockResolvedValueOnce([{ id: 'c2', target_app: { id: 'tgt' }, environment: 'PROD', connection_type: 'TCP', description: null }]);

      const result = await service.getDependencies('app-1', 'PROD');
      expect(result.upstream).toHaveLength(1);
      expect(result.downstream).toHaveLength(1);
    });
  });
});
