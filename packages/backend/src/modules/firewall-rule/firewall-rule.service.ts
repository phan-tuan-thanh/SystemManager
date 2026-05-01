import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFirewallRuleDto } from './dto/create-firewall-rule.dto';
import { UpdateFirewallRuleDto } from './dto/update-firewall-rule.dto';
import { QueryFirewallRuleDto } from './dto/query-firewall-rule.dto';

const RULE_INCLUDE = {
  source_zone: { select: { id: true, name: true, code: true, color: true } },
  destination_zone: { select: { id: true, name: true, code: true, color: true } },
  destination_server: { select: { id: true, code: true, name: true, environment: true } },
  destination_port: { select: { id: true, port_number: true, protocol: true, service_name: true } },
} as const;

@Injectable()
export class FirewallRuleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryFirewallRuleDto) {
    const where: any = { deleted_at: null };
    if (query.environment) where.environment = query.environment;
    if (query.action) where.action = query.action;
    if (query.status) where.status = query.status;
    if (query.source_zone_id) where.source_zone_id = query.source_zone_id;
    if (query.destination_server_id) where.destination_server_id = query.destination_server_id;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { source_ip: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.firewallRule.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'created_at']: query.sortOrder },
        include: RULE_INCLUDE,
      }),
      this.prisma.firewallRule.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const rule = await this.prisma.firewallRule.findFirst({
      where: { id, deleted_at: null },
      include: RULE_INCLUDE,
    });
    if (!rule) throw new NotFoundException(`FirewallRule ${id} not found`);
    return { data: rule };
  }

  async create(dto: CreateFirewallRuleDto) {
    const rule = await this.prisma.firewallRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        environment: dto.environment as any,
        source_zone_id: dto.source_zone_id,
        source_ip: dto.source_ip,
        destination_zone_id: dto.destination_zone_id,
        destination_server_id: dto.destination_server_id,
        destination_port_id: dto.destination_port_id,
        protocol: dto.protocol ?? 'TCP',
        action: (dto.action ?? 'ALLOW') as any,
        status: (dto.status ?? 'PENDING_APPROVAL') as any,
        request_date: dto.request_date ? new Date(dto.request_date) : null,
        approved_by: dto.approved_by,
        notes: dto.notes,
      },
      include: RULE_INCLUDE,
    });
    return { data: rule };
  }

  async update(id: string, dto: UpdateFirewallRuleDto) {
    await this.findOne(id);
    const rule = await this.prisma.firewallRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.source_zone_id !== undefined && { source_zone_id: dto.source_zone_id }),
        ...(dto.source_ip !== undefined && { source_ip: dto.source_ip }),
        ...(dto.destination_zone_id !== undefined && { destination_zone_id: dto.destination_zone_id }),
        ...(dto.destination_server_id !== undefined && { destination_server_id: dto.destination_server_id }),
        ...(dto.destination_port_id !== undefined && { destination_port_id: dto.destination_port_id }),
        ...(dto.protocol !== undefined && { protocol: dto.protocol }),
        ...(dto.action !== undefined && { action: dto.action as any }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.request_date !== undefined && { request_date: dto.request_date ? new Date(dto.request_date) : null }),
        ...(dto.approved_by !== undefined && { approved_by: dto.approved_by }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: RULE_INCLUDE,
    });
    return { data: rule };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.firewallRule.update({ where: { id }, data: { deleted_at: new Date() } });
    return { message: 'FirewallRule deleted' };
  }

  // ─── Import CSV/XLSX ─────────────────────────────────────────────

  async importRules(rows: Record<string, string>[]) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const REQUIRED = ['name', 'environment'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const missing = REQUIRED.filter((k) => !row[k]);
      if (missing.length) {
        results.errors.push(`Row ${i + 2}: missing ${missing.join(', ')}`);
        continue;
      }

      try {
        // Resolve server: accept UUID (destination_server_id) or friendly code (server_code)
        let serverId: string | null = row.destination_server_id || null;
        if (!serverId && row.server_code) {
          const srv = await this.prisma.server.findFirst({
            where: { code: row.server_code, deleted_at: null },
            select: { id: true },
          });
          if (!srv) {
            results.errors.push(`Row ${i + 2}: server '${row.server_code}' not found`);
            continue;
          }
          serverId = srv.id;
        }
        if (!serverId) {
          results.errors.push(`Row ${i + 2}: missing server_code or destination_server_id`);
          continue;
        }

        // Resolve source zone: accept UUID or zone code
        let srcZoneId: string | null = row.source_zone_id || null;
        if (!srcZoneId && row.source_zone_code) {
          const zone = await this.prisma.networkZone.findFirst({
            where: { code: row.source_zone_code, environment: row.environment as any, deleted_at: null },
            select: { id: true },
          });
          if (zone) srcZoneId = zone.id;
        }

        // Resolve destination zone: accept UUID or zone code
        let dstZoneId: string | null = row.destination_zone_id || null;
        if (!dstZoneId && row.destination_zone_code) {
          const zone = await this.prisma.networkZone.findFirst({
            where: { code: row.destination_zone_code, environment: row.environment as any, deleted_at: null },
            select: { id: true },
          });
          if (zone) dstZoneId = zone.id;
        }

        // Resolve port: accept UUID (destination_port_id) or port_number + server lookup
        let portId: string | null = row.destination_port_id || null;
        if (!portId && row.port_number && serverId) {
          const portNum = parseInt(row.port_number, 10);
          if (!isNaN(portNum)) {
            const port = await this.prisma.port.findFirst({
              where: {
                port_number: portNum,
                deployment: { server_id: serverId },
                deleted_at: null,
              },
              select: { id: true },
            });
            if (port) portId = port.id;
          }
        }

        const existing = await this.prisma.firewallRule.findFirst({
          where: {
            source_ip: row.source_ip || null,
            destination_server_id: serverId,
            destination_port_id: portId,
            environment: row.environment as any,
            deleted_at: null,
          },
        });

        if (existing) {
          await this.prisma.firewallRule.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              action: (row.action || 'ALLOW') as any,
              status: (row.status || 'PENDING_APPROVAL') as any,
              source_zone_id: srcZoneId,
              destination_zone_id: dstZoneId,
              destination_server_id: serverId,
              destination_port_id: portId,
              protocol: row.protocol || 'TCP',
              notes: row.notes || null,
            },
          });
          results.skipped++;
        } else {
          await this.prisma.firewallRule.create({
            data: {
              name: row.name,
              description: row.description || null,
              environment: row.environment as any,
              source_ip: row.source_ip || null,
              source_zone_id: srcZoneId,
              destination_server_id: serverId,
              destination_port_id: portId,
              destination_zone_id: dstZoneId,
              protocol: row.protocol || 'TCP',
              action: (row.action || 'ALLOW') as any,
              status: (row.status || 'PENDING_APPROVAL') as any,
              notes: row.notes || null,
            },
          });
          results.created++;
        }
      } catch (e: any) {
        results.errors.push(`Row ${i + 2}: ${e.message}`);
      }
    }

    return { data: results };
  }

  // ─── Export XLSX ─────────────────────────────────────────────────

  async exportXlsx(query: QueryFirewallRuleDto): Promise<Buffer> {
    const { data: rules } = await this.findAll({ ...query, limit: 10000, page: 1 });

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Firewall Rules Request');

    ws.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Tên Rule', key: 'name', width: 30 },
      { header: 'Môi trường', key: 'env', width: 12 },
      { header: 'Zone Nguồn', key: 'src_zone', width: 15 },
      { header: 'IP Nguồn', key: 'src_ip', width: 18 },
      { header: 'Server Đích', key: 'dst_server', width: 20 },
      { header: 'IP/Host Đích', key: 'dst_ip', width: 18 },
      { header: 'Cổng', key: 'port', width: 8 },
      { header: 'Giao thức', key: 'protocol', width: 10 },
      { header: 'Hành động', key: 'action', width: 12 },
      { header: 'Trạng thái', key: 'status', width: 18 },
      { header: 'Ngày yêu cầu', key: 'request_date', width: 14 },
      { header: 'Người phê duyệt', key: 'approved_by', width: 20 },
      { header: 'Ghi chú', key: 'notes', width: 30 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1890FF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 22;

    (rules as any[]).forEach((r, idx) => {
      const row = ws.addRow({
        stt: idx + 1,
        name: r.name,
        env: r.environment,
        src_zone: r.source_zone?.name ?? '',
        src_ip: r.source_ip ?? '',
        dst_server: r.destination_server?.name ?? r.destination_server_id,
        dst_ip: r.destination_server?.code ?? '',
        port: r.destination_port?.port_number ?? '',
        protocol: r.protocol,
        action: r.action,
        status: r.status,
        request_date: r.request_date ? new Date(r.request_date).toISOString().slice(0, 10) : '',
        approved_by: r.approved_by ?? '',
        notes: r.notes ?? '',
      });

      if (r.action === 'DENY') {
        row.getCell('action').font = { color: { argb: 'FFFF4D4F' }, bold: true };
      } else {
        row.getCell('action').font = { color: { argb: 'FF52C41A' }, bold: true };
      }
    });

    ws.autoFilter = { from: 'A1', to: 'N1' };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
