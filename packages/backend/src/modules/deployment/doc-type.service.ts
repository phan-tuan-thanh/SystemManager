import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDocTypeDto } from './dto/create-doc-type.dto';
import { UpdateDocTypeDto } from './dto/update-doc-type.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class DocTypeService {
  constructor(private prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.deploymentDocType.findMany({
        skip: query.skip,
        take: query.limit,
        orderBy: { sort_order: 'asc' },
      }),
      this.prisma.deploymentDocType.count(),
    ]);
    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const dt = await this.prisma.deploymentDocType.findUnique({ where: { id } });
    if (!dt) throw new NotFoundException(`DocType ${id} not found`);
    return dt;
  }

  async create(dto: CreateDocTypeDto) {
    const exists = await this.prisma.deploymentDocType.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`DocType with code '${dto.code}' already exists`);

    return this.prisma.deploymentDocType.create({ data: { ...dto, status: 'ACTIVE' } });
  }

  async update(id: string, dto: UpdateDocTypeDto) {
    const dt = await this.prisma.deploymentDocType.findUnique({ where: { id } });
    if (!dt) throw new NotFoundException(`DocType ${id} not found`);

    return this.prisma.deploymentDocType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const dt = await this.prisma.deploymentDocType.findUnique({ where: { id } });
    if (!dt) throw new NotFoundException(`DocType ${id} not found`);
    // DeploymentDocType doesn't have deleted_at — use status INACTIVE instead
    return this.prisma.deploymentDocType.update({ where: { id }, data: { status: 'INACTIVE' } });
  }
}
