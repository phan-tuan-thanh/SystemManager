import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAppGroupDto } from './dto/create-app-group.dto';
import { UpdateAppGroupDto } from './dto/update-app-group.dto';
import { QueryAppGroupDto } from './dto/query-app-group.dto';

@Injectable()
export class AppGroupService {
  constructor(private prisma: PrismaService) {}

  async list(query: QueryAppGroupDto) {
    const where: any = { deleted_at: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.group_type) where.group_type = query.group_type;

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { name: 'asc' as const };

    const [data, total] = await Promise.all([
      this.prisma.applicationGroup.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: { _count: { select: { applications: true, system_software: true } } },
      }),
      this.prisma.applicationGroup.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const group = await this.prisma.applicationGroup.findFirst({
      where: { id, deleted_at: null },
      include: {
        applications: { where: { deleted_at: null }, select: { id: true, code: true, name: true } },
        system_software: { where: { deleted_at: null }, select: { id: true, name: true, version: true } },
      },
    });
    if (!group) throw new NotFoundException(`AppGroup ${id} not found`);
    return group;
  }

  async create(dto: CreateAppGroupDto) {
    const exists = await this.prisma.applicationGroup.findFirst({
      where: { code: dto.code, deleted_at: null },
    });
    if (exists) throw new ConflictException(`AppGroup with code '${dto.code}' already exists`);

    return this.prisma.applicationGroup.create({ data: dto });
  }

  async update(id: string, dto: UpdateAppGroupDto) {
    const group = await this.prisma.applicationGroup.findFirst({ where: { id, deleted_at: null } });
    if (!group) throw new NotFoundException(`AppGroup ${id} not found`);

    if (dto.code && dto.code !== group.code) {
      const conflict = await this.prisma.applicationGroup.findFirst({
        where: { code: dto.code, deleted_at: null, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`AppGroup with code '${dto.code}' already exists`);
    }

    return this.prisma.applicationGroup.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const group = await this.prisma.applicationGroup.findFirst({ where: { id, deleted_at: null } });
    if (!group) throw new NotFoundException(`AppGroup ${id} not found`);
    await this.prisma.applicationGroup.update({ where: { id }, data: { deleted_at: new Date() } });
  }
}
