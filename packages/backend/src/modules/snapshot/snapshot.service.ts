import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TopologyService } from '../topology/topology.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { QuerySnapshotDto } from './dto/query-snapshot.dto';

@Injectable()
export class SnapshotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly topologyService: TopologyService,
  ) {}

  async create(dto: CreateSnapshotDto, userId: string) {
    const payload = await this.topologyService.getTopology(dto.environment);

    return this.prisma.topologySnapshot.create({
      data: {
        label: dto.label,
        environment: dto.environment ?? null,
        payload: payload as any,
        created_by: userId,
      },
    });
  }

  async findAll(query: QuerySnapshotDto) {
    const { page = 1, limit = 20, environment } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(environment ? { environment } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.topologySnapshot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          label: true,
          environment: true,
          created_by: true,
          created_at: true,
        },
      }),
      this.prisma.topologySnapshot.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const snapshot = await this.prisma.topologySnapshot.findUnique({
      where: { id },
    });
    if (!snapshot) throw new NotFoundException('Snapshot not found');
    return snapshot;
  }
}
