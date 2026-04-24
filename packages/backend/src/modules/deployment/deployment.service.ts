import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../change-history/change-history.service';
import { FileUploadService } from '../../common/services/file-upload.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';

@Injectable()
export class DeploymentService {
  constructor(
    private prisma: PrismaService,
    private changeHistory: ChangeHistoryService,
    private fileUpload: FileUploadService,
  ) {}

  async list(query: QueryDeploymentDto) {
    const where: any = { deleted_at: null };

    if (query.application_id) where.application_id = query.application_id;
    if (query.server_id) where.server_id = query.server_id;
    if (query.environment) where.environment = query.environment;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { cmc_name: { contains: query.search, mode: 'insensitive' } },
        { deployer: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { created_at: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.appDeployment.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          application: { select: { id: true, code: true, name: true } },
          server: { select: { id: true, code: true, name: true, environment: true } },
          _count: { select: { docs: true } },
        },
      }),
      this.prisma.appDeployment.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const deployment = await this.prisma.appDeployment.findFirst({
      where: { id, deleted_at: null },
      include: {
        application: { select: { id: true, code: true, name: true, group: { select: { id: true, name: true } } } },
        server: { select: { id: true, code: true, name: true, environment: true, site: true } },
        docs: {
          include: { doc_type: true },
          orderBy: { doc_type: { sort_order: 'asc' } },
        },
        ports: { where: { deleted_at: null } },
      },
    });
    if (!deployment) throw new NotFoundException(`Deployment ${id} not found`);

    const totalDocs = deployment.docs.length;
    const completeDocs = deployment.docs.filter((d) => d.status === 'COMPLETE').length;
    const waivedDocs = deployment.docs.filter((d) => d.status === 'WAIVED').length;

    return {
      ...deployment,
      doc_progress: {
        total: totalDocs,
        complete: completeDocs,
        waived: waivedDocs,
        pending: totalDocs - completeDocs - waivedDocs,
        pct: totalDocs > 0 ? Math.round(((completeDocs + waivedDocs) / totalDocs) * 100) : 100,
      },
    };
  }

  async create(dto: CreateDeploymentDto) {
    const application = await this.prisma.application.findFirst({
      where: { id: dto.application_id, deleted_at: null },
    });
    if (!application) throw new NotFoundException(`Application ${dto.application_id} not found`);

    const server = await this.prisma.server.findFirst({
      where: { id: dto.server_id, deleted_at: null },
    });
    if (!server) throw new NotFoundException(`Server ${dto.server_id} not found`);

    const deployment = await this.prisma.appDeployment.create({
      data: {
        ...dto,
        deployed_at: dto.deployed_at ? new Date(dto.deployed_at) : undefined,
        planned_at: dto.planned_at ? new Date(dto.planned_at) : undefined,
        status: dto.status ?? 'RUNNING',
      },
    });

    await this.autoCreateDocs(deployment.id, dto.environment);

    return deployment;
  }

  private async autoCreateDocs(deploymentId: string, environment: string) {
    const docTypes = await this.prisma.deploymentDocType.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { environments: { isEmpty: true } },
          { environments: { has: environment } },
        ],
      },
      orderBy: { sort_order: 'asc' },
    });

    if (docTypes.length === 0) return;

    await this.prisma.deploymentDoc.createMany({
      data: docTypes.map((dt) => ({
        deployment_id: deploymentId,
        doc_type_id: dt.id,
        status: 'PENDING',
      })),
      skipDuplicates: true,
    });
  }

  async update(id: string, dto: UpdateDeploymentDto, userId?: string) {
    const deployment = await this.prisma.appDeployment.findFirst({ where: { id, deleted_at: null } });
    if (!deployment) throw new NotFoundException(`Deployment ${id} not found`);

    await this.changeHistory.record({
      resourceType: 'deployment',
      resourceId: id,
      snapshot: { action: 'UPDATE', before: deployment, after: dto },
      changedBy: userId,
    });

    return this.prisma.appDeployment.update({
      where: { id },
      data: {
        ...dto,
        deployed_at: dto.deployed_at ? new Date(dto.deployed_at) : undefined,
        planned_at: dto.planned_at ? new Date(dto.planned_at) : undefined,
      },
    });
  }

  async remove(id: string) {
    const deployment = await this.prisma.appDeployment.findFirst({ where: { id, deleted_at: null } });
    if (!deployment) throw new NotFoundException(`Deployment ${id} not found`);
    await this.prisma.appDeployment.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  // ─── DeploymentDoc file operations ──────────────────────────────────────────

  private async findDoc(deploymentId: string, docTypeId: string) {
    const doc = await this.prisma.deploymentDoc.findFirst({
      where: { deployment_id: deploymentId, doc_type_id: docTypeId },
      include: { doc_type: true },
    });
    if (!doc) throw new NotFoundException(`DeploymentDoc not found for deployment=${deploymentId}, docType=${docTypeId}`);
    return doc;
  }

  async uploadPreview(
    deploymentId: string,
    docTypeId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    this.fileUpload.validatePreviewFile(file);
    const doc = await this.findDoc(deploymentId, docTypeId);

    const subDir = `deployments/${deploymentId}/preview`;
    const info = this.fileUpload.saveFile(file, subDir);

    return this.prisma.deploymentDoc.update({
      where: { id: doc.id },
      data: {
        preview_path: info.path,
        status: 'PREVIEW',
        uploaded_by: userId,
      },
    });
  }

  async uploadFinal(
    deploymentId: string,
    docTypeId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    this.fileUpload.validateFinalFile(file);
    const doc = await this.findDoc(deploymentId, docTypeId);

    const subDir = `deployments/${deploymentId}/final`;
    const info = this.fileUpload.saveFile(file, subDir);

    return this.prisma.deploymentDoc.update({
      where: { id: doc.id },
      data: {
        final_path: info.path,
        status: 'COMPLETE',
        uploaded_by: userId,
      },
    });
  }

  async waiveDoc(
    deploymentId: string,
    docTypeId: string,
    reason: string,
    userId: string,
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Waive reason is required');
    }
    const doc = await this.findDoc(deploymentId, docTypeId);

    return this.prisma.deploymentDoc.update({
      where: { id: doc.id },
      data: {
        status: 'WAIVED',
        waived_reason: reason.trim(),
        uploaded_by: userId,
      },
    });
  }

  async serveFile(
    deploymentId: string,
    docTypeId: string,
    type: 'preview' | 'final',
    res: Response,
  ) {
    const doc = await this.findDoc(deploymentId, docTypeId);
    const filePath = type === 'final' ? doc.final_path : doc.preview_path;

    if (!filePath) {
      throw new NotFoundException(`No ${type} file uploaded for this document`);
    }

    const absolutePath = this.fileUpload.getAbsolutePath(filePath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found on disk');
    }

    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'bin';
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      doc: 'application/msword',
      xls: 'application/vnd.ms-excel',
    };
    const contentType = mimeMap[ext] ?? 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
    });

    createReadStream(absolutePath).pipe(res);
  }
}
