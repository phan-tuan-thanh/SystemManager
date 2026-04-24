import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PortService } from '../port.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

const mockPrisma = {
  port: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  application: { findFirst: jest.fn() },
  appDeployment: { findFirst: jest.fn() },
};

describe('PortService', () => {
  let service: PortService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PortService>(PortService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create port without deployment (no conflict check)', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 'app1' });
      mockPrisma.port.create.mockResolvedValue({ id: 'p1', port_number: 8080, protocol: 'TCP' });

      const result = await service.create({ application_id: 'app1', port_number: 8080 });
      expect(result.port_number).toBe(8080);
      expect(mockPrisma.appDeployment.findFirst).not.toHaveBeenCalled();
    });

    it('should check conflict when deployment_id is provided', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 'app1' });
      mockPrisma.appDeployment.findFirst.mockResolvedValue({ server_id: 'srv1' });
      mockPrisma.port.findFirst.mockResolvedValue(null); // no conflict
      mockPrisma.port.create.mockResolvedValue({ id: 'p1', port_number: 8080, protocol: 'TCP' });

      const result = await service.create({
        application_id: 'app1',
        deployment_id: 'dep1',
        port_number: 8080,
      });
      expect(result.id).toBe('p1');
    });

    it('should throw ConflictException if port is already in use on same server', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 'app1' });
      mockPrisma.appDeployment.findFirst.mockResolvedValue({ server_id: 'srv1' });
      mockPrisma.port.findFirst.mockResolvedValue({
        id: 'p_existing',
        port_number: 8080,
        protocol: 'TCP',
        application: { name: 'Other App' },
        deployment: { server: { name: 'srv-01' } },
      });

      await expect(service.create({
        application_id: 'app1',
        deployment_id: 'dep1',
        port_number: 8080,
      })).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if application not found', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null);
      await expect(service.create({ application_id: 'invalid', port_number: 8080 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete port', async () => {
      mockPrisma.port.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.port.update.mockResolvedValue({});

      await service.remove('p1');
      expect(mockPrisma.port.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deleted_at: expect.any(Date) }) }),
      );
    });
  });
});
