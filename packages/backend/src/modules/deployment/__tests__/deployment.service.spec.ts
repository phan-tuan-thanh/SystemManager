import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeploymentService } from '../deployment.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../../change-history/change-history.service';

const mockPrisma = {
  appDeployment: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  application: { findFirst: jest.fn() },
  server: { findFirst: jest.fn() },
  deploymentDocType: { findMany: jest.fn() },
  deploymentDoc: { createMany: jest.fn() },
};

const mockChangeHistory = { record: jest.fn() };

describe('DeploymentService', () => {
  let service: DeploymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChangeHistoryService, useValue: mockChangeHistory },
      ],
    }).compile();

    service = module.get<DeploymentService>(DeploymentService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create deployment and auto-create docs', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 'app1' });
      mockPrisma.server.findFirst.mockResolvedValue({ id: 'srv1' });
      mockPrisma.appDeployment.create.mockResolvedValue({
        id: 'd1', application_id: 'app1', server_id: 'srv1', environment: 'PROD', version: '1.0',
      });
      mockPrisma.deploymentDocType.findMany.mockResolvedValue([
        { id: 'dt1', status: 'ACTIVE', environments: ['PROD'] },
        { id: 'dt2', status: 'ACTIVE', environments: [] },
      ]);
      mockPrisma.deploymentDoc.createMany.mockResolvedValue({ count: 2 });

      const result = await service.create({
        application_id: 'app1',
        server_id: 'srv1',
        environment: 'PROD',
        version: '1.0',
      });

      expect(result.id).toBe('d1');
      expect(mockPrisma.deploymentDoc.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ deployment_id: 'd1', doc_type_id: 'dt1' }),
            expect.objectContaining({ deployment_id: 'd1', doc_type_id: 'dt2' }),
          ]),
        }),
      );
    });

    it('should throw NotFoundException if application not found', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null);
      await expect(service.create({
        application_id: 'invalid', server_id: 'srv1', environment: 'PROD', version: '1.0',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete deployment', async () => {
      mockPrisma.appDeployment.findFirst.mockResolvedValue({ id: 'd1' });
      mockPrisma.appDeployment.update.mockResolvedValue({});

      await service.remove('d1');
      expect(mockPrisma.appDeployment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deleted_at: expect.any(Date) }) }),
      );
    });
  });
});
