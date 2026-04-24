import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ChangeHistoryService {
  constructor(private prisma: PrismaService) {}

  async record(params: {
    resourceType: string;
    resourceId: string;
    snapshot: object;
    changedBy?: string;
  }): Promise<void> {
    await this.prisma.changeHistory.create({
      data: {
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        snapshot: params.snapshot as any,
        changed_by: params.changedBy ?? null,
      },
    });
  }

  async getHistory(resourceType: string, resourceId: string, query: PaginationDto) {
    const where = { resource_type: resourceType, resource_id: resourceId };

    const [data, total] = await Promise.all([
      this.prisma.changeHistory.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.changeHistory.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }
}
