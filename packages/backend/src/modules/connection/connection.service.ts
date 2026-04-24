import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { QueryConnectionDto } from './dto/query-connection.dto';

const APP_SELECT = { id: true, code: true, name: true, group: { select: { id: true, name: true } } };

@Injectable()
export class ConnectionService {
  constructor(private prisma: PrismaService) {}

  async list(query: QueryConnectionDto) {
    const where: any = { deleted_at: null };

    if (query.environment) where.environment = query.environment;
    if (query.source_app_id) where.source_app_id = query.source_app_id;
    if (query.target_app_id) where.target_app_id = query.target_app_id;
    if (query.connection_type) where.connection_type = query.connection_type;
    if (query.search) {
      where.OR = [
        { source_app: { name: { contains: query.search, mode: 'insensitive' } } },
        { target_app: { name: { contains: query.search, mode: 'insensitive' } } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { created_at: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.appConnection.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          source_app: { select: APP_SELECT },
          target_app: { select: APP_SELECT },
          target_port: { select: { id: true, port_number: true, protocol: true } },
        },
      }),
      this.prisma.appConnection.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const conn = await this.prisma.appConnection.findFirst({
      where: { id, deleted_at: null },
      include: {
        source_app: { select: APP_SELECT },
        target_app: { select: APP_SELECT },
        target_port: { select: { id: true, port_number: true, protocol: true } },
      },
    });
    if (!conn) throw new NotFoundException(`Connection ${id} not found`);
    return conn;
  }

  async create(dto: CreateConnectionDto) {
    if (dto.source_app_id === dto.target_app_id) {
      throw new BadRequestException('Source and target application cannot be the same');
    }

    const [source, target] = await Promise.all([
      this.prisma.application.findFirst({ where: { id: dto.source_app_id, deleted_at: null } }),
      this.prisma.application.findFirst({ where: { id: dto.target_app_id, deleted_at: null } }),
    ]);
    if (!source) throw new NotFoundException(`Source application ${dto.source_app_id} not found`);
    if (!target) throw new NotFoundException(`Target application ${dto.target_app_id} not found`);

    if (dto.target_port_id) {
      const port = await this.prisma.port.findFirst({ where: { id: dto.target_port_id, deleted_at: null } });
      if (!port) throw new NotFoundException(`Port ${dto.target_port_id} not found`);
      if (port.application_id !== target.id) {
        throw new BadRequestException(`Port ${dto.target_port_id} does not belong to target app ${target.id}`);
      }
    }

    return this.prisma.appConnection.create({
      data: dto as any,
      include: {
        source_app: { select: APP_SELECT },
        target_app: { select: APP_SELECT },
        target_port: { select: { id: true, port_number: true, protocol: true } },
      },
    });
  }

  async update(id: string, dto: UpdateConnectionDto) {
    const conn = await this.prisma.appConnection.findFirst({ where: { id, deleted_at: null } });
    if (!conn) throw new NotFoundException(`Connection ${id} not found`);

    const sourceId = dto.source_app_id ?? conn.source_app_id;
    const targetId = dto.target_app_id ?? conn.target_app_id;
    if (sourceId === targetId) {
      throw new BadRequestException('Source and target application cannot be the same');
    }

    if (dto.target_port_id) {
      const port = await this.prisma.port.findFirst({ where: { id: dto.target_port_id, deleted_at: null } });
      if (!port) throw new NotFoundException(`Port ${dto.target_port_id} not found`);
      if (port.application_id !== targetId) {
        throw new BadRequestException(`Port ${dto.target_port_id} does not belong to target app ${targetId}`);
      }
    }
    
    return this.prisma.appConnection.update({
      where: { id },
      data: dto as any,
      include: {
        source_app: { select: APP_SELECT },
        target_app: { select: APP_SELECT },
        target_port: { select: { id: true, port_number: true, protocol: true } },
      },
    });
  }

  async remove(id: string) {
    const conn = await this.prisma.appConnection.findFirst({ where: { id, deleted_at: null } });
    if (!conn) throw new NotFoundException(`Connection ${id} not found`);
    await this.prisma.appConnection.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /**
   * S7-03: Get upstream (dependencies) and downstream (dependents) for an app in an env
   */
  async getDependencies(applicationId: string, environment?: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, deleted_at: null },
    });
    if (!app) throw new NotFoundException(`Application ${applicationId} not found`);

    const envFilter = environment ? { environment } : {};

    const [upstream, downstream] = await Promise.all([
      // upstream: connections where THIS app is the target (sources depend on me)
      this.prisma.appConnection.findMany({
        where: { target_app_id: applicationId, deleted_at: null, ...envFilter },
        include: { source_app: { select: APP_SELECT } },
        orderBy: { created_at: 'asc' },
      }),
      // downstream: connections where THIS app is the source (I depend on targets)
      this.prisma.appConnection.findMany({
        where: { source_app_id: applicationId, deleted_at: null, ...envFilter },
        include: { target_app: { select: APP_SELECT } },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    return {
      application_id: applicationId,
      upstream: upstream.map((c) => ({
        connection_id: c.id,
        environment: c.environment,
        connection_type: c.connection_type,
        description: c.description,
        app: c.source_app,
      })),
      downstream: downstream.map((c) => ({
        connection_id: c.id,
        environment: c.environment,
        connection_type: c.connection_type,
        description: c.description,
        app: c.target_app,
      })),
    };
  }
}
