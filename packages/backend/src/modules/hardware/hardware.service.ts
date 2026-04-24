import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChangeHistoryService } from '../change-history/change-history.service';
import { QueryHardwareDto } from './dto/query-hardware.dto';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';
import { AttachHardwareDto } from './dto/attach-hardware.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

const HARDWARE_SELECT = {
  id: true,
  server_id: true,
  type: true,
  model: true,
  manufacturer: true,
  serial: true,
  specs: true,
  created_at: true,
  updated_at: true,
  server: { select: { id: true, code: true, name: true, environment: true } },
} as const;

@Injectable()
export class HardwareService {
  constructor(
    private prisma: PrismaService,
    private changeHistoryService: ChangeHistoryService,
  ) {}

  async findAll(query: QueryHardwareDto) {
    const where: any = {
      deleted_at: null,
      ...(query.server_id && { server_id: query.server_id }),
      ...(query.type && { type: query.type }),
      ...(query.search && {
        OR: [
          { model: { contains: query.search, mode: 'insensitive' as const } },
          { manufacturer: { contains: query.search, mode: 'insensitive' as const } },
          { serial: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.hardwareComponent.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'created_at']: query.sortOrder },
        select: HARDWARE_SELECT,
      }),
      this.prisma.hardwareComponent.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const component = await this.prisma.hardwareComponent.findFirst({
      where: { id, deleted_at: null },
      select: HARDWARE_SELECT,
    });

    if (!component) throw new NotFoundException('Hardware component not found');
    return component;
  }

  async create(dto: CreateHardwareDto, userId?: string) {
    // Verify server exists
    const server = await this.prisma.server.findFirst({
      where: { id: dto.server_id, deleted_at: null },
      select: { id: true },
    });
    if (!server) throw new NotFoundException('Server not found');

    const component = await this.prisma.hardwareComponent.create({
      data: {
        server_id: dto.server_id,
        type: dto.type,
        model: dto.model,
        manufacturer: dto.manufacturer,
        serial: dto.serial,
        specs: dto.specs as any,
      },
      select: HARDWARE_SELECT,
    });

    await this.changeHistoryService.record({
      resourceType: 'HardwareComponent',
      resourceId: component.id,
      snapshot: { action: 'CREATE', data: component },
      changedBy: userId,
    });

    return component;
  }

  async update(id: string, dto: UpdateHardwareDto, userId?: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.hardwareComponent.update({
      where: { id },
      data: {
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
        ...(dto.serial !== undefined && { serial: dto.serial }),
        ...(dto.specs !== undefined && { specs: dto.specs as any }),
      },
      select: HARDWARE_SELECT,
    });

    await this.changeHistoryService.record({
      resourceType: 'HardwareComponent',
      resourceId: id,
      snapshot: { action: 'UPDATE', before: existing, after: updated },
      changedBy: userId,
    });

    return updated;
  }

  async attach(id: string, dto: AttachHardwareDto, userId?: string) {
    const existing = await this.findOne(id);

    // Verify target server exists
    const server = await this.prisma.server.findFirst({
      where: { id: dto.server_id, deleted_at: null },
      select: { id: true, code: true, name: true },
    });
    if (!server) throw new NotFoundException('Target server not found');

    const updated = await this.prisma.hardwareComponent.update({
      where: { id },
      data: { server_id: dto.server_id },
      select: HARDWARE_SELECT,
    });

    await this.changeHistoryService.record({
      resourceType: 'HardwareComponent',
      resourceId: id,
      snapshot: {
        action: 'ATTACH',
        from_server: (existing as any).server,
        to_server: server,
      },
      changedBy: userId,
    });

    return updated;
  }

  async detach(id: string, userId?: string) {
    const existing = await this.findOne(id);

    await this.prisma.hardwareComponent.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.changeHistoryService.record({
      resourceType: 'HardwareComponent',
      resourceId: id,
      snapshot: { action: 'DETACH', data: existing },
      changedBy: userId,
    });

    return { message: 'Hardware component detached and retired successfully' };
  }

  async getHistory(id: string, query: PaginationDto) {
    await this.findOne(id);
    return this.changeHistoryService.getHistory('HardwareComponent', id, query);
  }
}
