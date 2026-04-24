import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../change-history/change-history.service';
import { QueryServerDto } from './dto/query-server.dto';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { CreateOsInstallDto } from './dto/create-os-install.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PubSub } from 'graphql-subscriptions';
import { TOPOLOGY_PUB_SUB, SERVER_STATUS_CHANGED } from '../topology/topology.constants';

const SERVER_SELECT = {
  id: true,
  code: true,
  name: true,
  hostname: true,
  purpose: true,
  status: true,
  environment: true,
  infra_type: true,
  site: true,
  description: true,
  infra_system_id: true,
  infra_system: { select: { id: true, code: true, name: true } },
  current_os_install: {
    include: { application: { select: { name: true } } },
  },
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class ServerService {
  constructor(
    private prisma: PrismaService,
    private changeHistoryService: ChangeHistoryService,
    @Inject(TOPOLOGY_PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async findAll(query: QueryServerDto) {
    const where: any = {
      deleted_at: null,
      ...(query.environment && { environment: query.environment }),
      ...(query.status && { status: query.status }),
      ...(query.infra_type && { infra_type: query.infra_type }),
      ...(query.site && { site: query.site }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { code: { contains: query.search, mode: 'insensitive' as const } },
          { hostname: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.server.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'name']: query.sortBy ? query.sortOrder : 'asc' },
        select: {
          ...SERVER_SELECT,
          _count: { select: { app_deployments: { where: { deleted_at: null } } } },
        },
      }),
      this.prisma.server.count({ where }),
    ]);

    const data = items.map(({ _count, current_os_install, ...rest }) => ({
      ...rest,
      current_os_install,
      os_display: current_os_install
        ? `${current_os_install.application.name} ${current_os_install.version}`.trim()
        : null,
      app_count: _count.app_deployments,
    }));

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const server = await this.prisma.server.findFirst({
      where: { id, deleted_at: null },
      select: {
        ...SERVER_SELECT,
        hardware_components: {
          where: { deleted_at: null },
          select: {
            id: true,
            type: true,
            model: true,
            manufacturer: true,
            serial: true,
            specs: true,
            created_at: true,
          },
        },
        network_configs: {
          where: { deleted_at: null },
          select: {
            id: true,
            interface: true,
            private_ip: true,
            public_ip: true,
            nat_ip: true,
            domain: true,
            subnet: true,
            gateway: true,
            dns: true,
            created_at: true,
          },
        },
        app_deployments: {
          where: { deleted_at: null },
          select: {
            id: true,
            environment: true,
            version: true,
            status: true,
            title: true,
            deployed_at: true,
            application: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    if (!server) throw new NotFoundException('Server not found');

    const { current_os_install, ...rest } = server;
    return {
      ...rest,
      current_os_install,
      os_display: current_os_install
        ? `${current_os_install.application.name} ${current_os_install.version}`.trim()
        : null,
    };
  }

  async create(dto: CreateServerDto, userId?: string) {
    const existing = await this.prisma.server.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Server code '${dto.code}' already exists`);

    const server = await this.prisma.server.create({
      data: {
        code: dto.code,
        name: dto.name,
        hostname: dto.hostname,
        environment: dto.environment,
        purpose: dto.purpose ?? 'APP_SERVER',
        status: dto.status ?? 'ACTIVE',
        infra_type: dto.infra_type ?? 'VIRTUAL_MACHINE',
        site: dto.site ?? 'DC',
        description: dto.description,
        infra_system_id: dto.infra_system_id ?? null,
      },
      select: SERVER_SELECT,
    });

    await this.changeHistoryService.record({
      resourceType: 'Server',
      resourceId: server.id,
      snapshot: { action: 'CREATE', data: server },
      changedBy: userId,
    });

    return server;
  }

  async update(id: string, dto: UpdateServerDto, userId?: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.server.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.hostname !== undefined && { hostname: dto.hostname }),
        ...(dto.purpose !== undefined && { purpose: dto.purpose }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.environment !== undefined && { environment: dto.environment }),
        ...(dto.infra_type !== undefined && { infra_type: dto.infra_type }),
        ...(dto.site !== undefined && { site: dto.site }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.infra_system_id !== undefined && { infra_system_id: dto.infra_system_id || null }),
      },
      select: SERVER_SELECT,
    });

    await this.changeHistoryService.record({
      resourceType: 'Server',
      resourceId: id,
      snapshot: { action: 'UPDATE', before: existing, after: updated },
      changedBy: userId,
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);

    await this.prisma.server.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.changeHistoryService.record({
      resourceType: 'Server',
      resourceId: id,
      snapshot: { action: 'DELETE', data: existing },
      changedBy: userId,
    });

    return { message: 'Server deleted successfully' };
  }

  async getChangeHistory(id: string, query: PaginationDto) {
    await this.findOne(id);
    return this.changeHistoryService.getHistory('Server', id, query);
  }

  async updateStatus(id: string, status: string, userId?: string) {
    const existing = await this.prisma.server.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException('Server not found');

    const updated = await this.prisma.server.update({
      where: { id },
      data: { status: status as any },
      select: SERVER_SELECT,
    });

    await this.changeHistoryService.record({
      resourceType: 'Server',
      resourceId: id,
      snapshot: { action: 'UPDATE', before: { status: existing.status }, after: { status: updated.status } },
      changedBy: userId,
    });

    await this.pubSub.publish(SERVER_STATUS_CHANGED, {
      serverStatusChanged: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        environment: updated.environment,
      },
    });

    return updated;
  }

  async getApplications(id: string) {
    const server = await this.prisma.server.findFirst({ where: { id, deleted_at: null } });
    if (!server) throw new NotFoundException('Server not found');

    const deployments = await this.prisma.appDeployment.findMany({
      where: { server_id: id, deleted_at: null },
      include: {
        application: {
          select: { id: true, code: true, name: true, group: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ environment: 'asc' }, { created_at: 'desc' }],
    });

    return deployments;
  }

  async installOs(id: string, dto: CreateOsInstallDto, userId?: string) {
    const server = await this.prisma.server.findFirst({
      where: { id, deleted_at: null },
    });
    if (!server) throw new NotFoundException(`Server ${id} not found`);

    // Validate application is an OS
    const app = await this.prisma.application.findFirst({
      where: { id: dto.application_id, application_type: 'SYSTEM', sw_type: 'OS', deleted_at: null },
    });
    if (!app) throw new NotFoundException(`OS Application ${dto.application_id} not found or is not an OS`);

    if (server.current_os_install_id && !dto.change_reason) {
      throw new ConflictException('change_reason is required when upgrading OS');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. If has current, set replaced_at
      if (server.current_os_install_id) {
        await tx.serverOsInstall.update({
          where: { id: server.current_os_install_id },
          data: { replaced_at: new Date() },
        });
      }

      // 2. Create new record
      const install = await tx.serverOsInstall.create({
        data: {
          server_id: id,
          application_id: dto.application_id,
          version: dto.version,
          installed_at: new Date(dto.installed_at),
          installed_by_id: userId,
          change_reason: dto.change_reason,
          change_ticket: dto.change_ticket,
          notes: dto.notes,
        },
        include: { application: { select: { name: true } } },
      });

      // 3. Update server pointer
      await tx.server.update({
        where: { id },
        data: { current_os_install_id: install.id },
      });

      return install;
    });
  }

  async getOsHistory(id: string) {
    await this.findOne(id);
    return this.prisma.serverOsInstall.findMany({
      where: { server_id: id },
      include: {
        application: { select: { name: true } },
        installed_by: { select: { id: true, full_name: true } },
      },
      orderBy: { installed_at: 'desc' },
    });
  }
}
