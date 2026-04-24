import { Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAuditDto) {
    const where = {
      ...(query.action && { action: query.action }),
      ...(query.resource_type && { resource_type: query.resource_type }),
      ...(query.user_id && { user_id: query.user_id }),
      ...(query.from && query.to && {
        created_at: {
          gte: new Date(query.from),
          lte: new Date(query.to),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { created_at: query.sortOrder },
        include: {
          user: { select: { id: true, full_name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, full_name: true, email: true } } },
    });
    if (!log) throw new NotFoundException(`Audit log ${id} not found`);
    return log;
  }

  async exportCsv(query: QueryAuditDto, res: Response) {
    const where = {
      ...(query.action && { action: query.action }),
      ...(query.resource_type && { resource_type: query.resource_type }),
      ...(query.user_id && { user_id: query.user_id }),
      ...(query.from && query.to && {
        created_at: { gte: new Date(query.from), lte: new Date(query.to) },
      }),
    };

    const BATCH = 500;
    let skip = 0;
    const csvHeader = 'id,user_email,action,resource_type,resource_id,result,ip_address,created_at\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.write(csvHeader);

    while (true) {
      const rows = await this.prisma.auditLog.findMany({
        where,
        skip,
        take: BATCH,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { email: true } } },
      });

      if (rows.length === 0) break;

      const csvRows = rows.map((r) => [
        r.id,
        r.user?.email ?? '',
        r.action,
        r.resource_type,
        r.resource_id ?? '',
        r.result,
        r.ip_address ?? '',
        r.created_at.toISOString(),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

      res.write(csvRows.join('\n') + '\n');
      skip += BATCH;
      if (rows.length < BATCH) break;
    }

    res.end();
  }
}
