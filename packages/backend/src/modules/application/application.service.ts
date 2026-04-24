import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../change-history/change-history.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private changeHistory: ChangeHistoryService,
  ) {}

  async list(query: QueryApplicationDto) {
    const where: any = { deleted_at: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.group_id) where.group_id = query.group_id;
    if (query.application_type) where.application_type = query.application_type;
    if (query.sw_type) where.sw_type = query.sw_type;
    if (query.group_type) where.group = { group_type: query.group_type };
    if (query.environment) {
      where.app_deployments = {
        some: { environment: query.environment, deleted_at: null },
      };
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { name: 'asc' as const };

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          group: { select: { id: true, code: true, name: true } },
          _count: { select: { app_deployments: true, ports: true } },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, deleted_at: null },
      include: {
        group: true,
        app_deployments: {
          where: { deleted_at: null, status: 'RUNNING' },
          include: { server: { select: { id: true, name: true, environment: true, status: true } } },
        },
        ports: { where: { deleted_at: null } },
      },
    });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }

  async whereRunning(id: string) {
    const app = await this.prisma.application.findFirst({ where: { id, deleted_at: null } });
    if (!app) throw new NotFoundException(`Application ${id} not found`);

    const deployments = await this.prisma.appDeployment.findMany({
      where: { application_id: id, deleted_at: null, status: 'RUNNING' },
      include: {
        server: { select: { id: true, code: true, name: true, environment: true, site: true, status: true } },
      },
      orderBy: [{ environment: 'asc' }, { created_at: 'desc' }],
    });

    // Group by environment and flatten server fields
    const grouped = deployments.reduce((acc: any, d) => {
      const env = d.environment;
      if (!acc[env]) acc[env] = [];
      acc[env].push({
        deployment_id: d.id,
        version: d.version,
        server_id: d.server.id,
        server_code: d.server.code,
        server_name: d.server.name,
        status: d.server.status,
      });
      return acc;
    }, {});

    // Convert to array format: [{ environment, servers: [...] }]
    return Object.entries(grouped).map(([environment, servers]) => ({
      environment,
      servers,
    }));
  }

  async create(dto: CreateApplicationDto) {
    const group = await this.prisma.applicationGroup.findFirst({
      where: { id: dto.group_id, deleted_at: null },
    });
    if (!group) throw new NotFoundException(`AppGroup ${dto.group_id} not found`);

    const appType = dto.application_type ?? 'BUSINESS';
    if (appType === 'BUSINESS' && group.group_type !== 'BUSINESS') {
      throw new BadRequestException(
        `Ứng dụng nghiệp vụ (BUSINESS) phải thuộc nhóm loại BUSINESS. Nhóm "${group.name}" có loại INFRASTRUCTURE.`,
      );
    }
    if (appType === 'SYSTEM' && group.group_type !== 'INFRASTRUCTURE') {
      throw new BadRequestException(
        `Phần mềm hạ tầng (SYSTEM) phải thuộc nhóm loại INFRASTRUCTURE. Nhóm "${group.name}" có loại BUSINESS.`,
      );
    }

    const exists = await this.prisma.application.findFirst({
      where: { code: dto.code, deleted_at: null },
    });
    if (exists) throw new ConflictException(`Application with code '${dto.code}' already exists`);

    return this.prisma.application.create({
      data: {
        ...dto,
        eol_date: dto.eol_date ? new Date(dto.eol_date) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateApplicationDto, userId?: string) {
    const app = await this.prisma.application.findFirst({ where: { id, deleted_at: null } });
    if (!app) throw new NotFoundException(`Application ${id} not found`);

    if (dto.code && dto.code !== app.code) {
      const conflict = await this.prisma.application.findFirst({
        where: { code: dto.code, deleted_at: null, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`Application with code '${dto.code}' already exists`);
    }

    if (dto.group_id && dto.group_id !== app.group_id) {
      const newGroup = await this.prisma.applicationGroup.findFirst({
        where: { id: dto.group_id, deleted_at: null },
      });
      if (!newGroup) throw new NotFoundException(`AppGroup ${dto.group_id} not found`);

      const appType = app.application_type;
      if (appType === 'BUSINESS' && newGroup.group_type !== 'BUSINESS') {
        throw new BadRequestException(
          `Ứng dụng nghiệp vụ (BUSINESS) phải thuộc nhóm loại BUSINESS. Nhóm "${newGroup.name}" có loại INFRASTRUCTURE.`,
        );
      }
      if (appType === 'SYSTEM' && newGroup.group_type !== 'INFRASTRUCTURE') {
        throw new BadRequestException(
          `Phần mềm hạ tầng (SYSTEM) phải thuộc nhóm loại INFRASTRUCTURE. Nhóm "${newGroup.name}" có loại BUSINESS.`,
        );
      }
    }

    // Snapshot before update
    await this.changeHistory.record({
      resourceType: 'application',
      resourceId: id,
      snapshot: { action: 'UPDATE', before: app, after: dto },
      changedBy: userId,
    });

    return this.prisma.application.update({
      where: { id },
      data: {
        ...dto,
        eol_date: dto.eol_date ? new Date(dto.eol_date) : undefined,
      },
    });
  }

  async remove(id: string) {
    const app = await this.prisma.application.findFirst({ where: { id, deleted_at: null } });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    await this.prisma.application.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async getHistory(id: string) {
    const app = await this.prisma.application.findFirst({ where: { id, deleted_at: null } });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return this.changeHistory.getHistory('application', id, { page: 1, limit: 50, skip: 0, sortOrder: 'desc' } as any);
  }
}
