import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNetworkZoneDto } from './dto/create-network-zone.dto';
import { UpdateNetworkZoneDto } from './dto/update-network-zone.dto';
import { QueryNetworkZoneDto } from './dto/query-network-zone.dto';
import { CreateZoneIpDto } from './dto/create-zone-ip.dto';
import { BulkImportIpsDto } from './dto/bulk-import-ips.dto';

const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

function isValidIpOrCidr(value: string): boolean {
  return CIDR_REGEX.test(value) || IP_REGEX.test(value);
}

@Injectable()
export class NetworkZoneService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryNetworkZoneDto) {
    const where: any = { deleted_at: null };
    if (query.environment) where.environment = query.environment;
    if (query.zone_type) where.zone_type = query.zone_type;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.networkZone.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'created_at']: query.sortOrder },
        include: {
          _count: { select: { ip_entries: { where: { deleted_at: null } } } },
        },
      }),
      this.prisma.networkZone.count({ where }),
    ]);

    return {
      data: data.map((z) => ({ ...z, ip_count: z._count.ip_entries, _count: undefined })),
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async findOne(id: string) {
    const zone = await this.prisma.networkZone.findFirst({
      where: { id, deleted_at: null },
      include: {
        ip_entries: { where: { deleted_at: null }, orderBy: { created_at: 'asc' } },
      },
    });
    if (!zone) throw new NotFoundException(`NetworkZone ${id} not found`);
    return { data: zone };
  }

  async create(dto: CreateNetworkZoneDto) {
    const existing = await this.prisma.networkZone.findFirst({
      where: { code: dto.code.toUpperCase(), environment: dto.environment as any, deleted_at: null },
    });
    if (existing) {
      throw new ConflictException(`Zone code '${dto.code}' already exists in ${dto.environment}`);
    }

    const zone = await this.prisma.networkZone.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        zone_type: (dto.zone_type || 'CUSTOM') as any,
        description: dto.description,
        color: dto.color,
        environment: dto.environment as any,
      },
    });
    return { data: zone };
  }

  async update(id: string, dto: UpdateNetworkZoneDto) {
    await this.findOne(id);

    if (dto.code) {
      const conflict = await this.prisma.networkZone.findFirst({
        where: {
          code: dto.code.toUpperCase(),
          environment: (dto.environment || undefined) as any,
          deleted_at: null,
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException(`Zone code '${dto.code}' already exists`);
      }
    }

    const zone = await this.prisma.networkZone.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.zone_type && { zone_type: dto.zone_type as any }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });
    return { data: zone };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.networkZone.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { message: 'Zone deleted' };
  }

  // ─── ZoneIpEntry ─────────────────────────────────────────────────

  async listIps(zoneId: string) {
    await this.findOne(zoneId);
    const entries = await this.prisma.zoneIpEntry.findMany({
      where: { zone_id: zoneId, deleted_at: null },
      orderBy: { created_at: 'asc' },
    });
    return { data: entries };
  }

  async addIp(zoneId: string, dto: CreateZoneIpDto) {
    await this.findOne(zoneId);

    if (!isValidIpOrCidr(dto.ip_address)) {
      throw new BadRequestException(`Invalid IP/CIDR format: ${dto.ip_address}`);
    }

    const existing = await this.prisma.zoneIpEntry.findFirst({
      where: { zone_id: zoneId, ip_address: dto.ip_address, deleted_at: null },
    });
    if (existing) throw new ConflictException(`IP ${dto.ip_address} already exists in this zone`);

    const entry = await this.prisma.zoneIpEntry.create({
      data: {
        zone_id: zoneId,
        ip_address: dto.ip_address,
        label: dto.label,
        description: dto.description,
        is_range: dto.is_range ?? CIDR_REGEX.test(dto.ip_address),
      },
    });
    return { data: entry };
  }

  async bulkImportIps(zoneId: string, dto: BulkImportIpsDto) {
    await this.findOne(zoneId);

    const results = { added: 0, skipped: 0, invalid: [] as string[] };

    for (const rawIp of dto.ips) {
      const ip = rawIp.trim();
      if (!ip) continue;
      if (!isValidIpOrCidr(ip)) {
        results.invalid.push(ip);
        continue;
      }
      const existing = await this.prisma.zoneIpEntry.findFirst({
        where: { zone_id: zoneId, ip_address: ip, deleted_at: null },
      });
      if (existing) { results.skipped++; continue; }

      await this.prisma.zoneIpEntry.create({
        data: {
          zone_id: zoneId,
          ip_address: ip,
          is_range: CIDR_REGEX.test(ip),
        },
      });
      results.added++;
    }

    return { data: results };
  }

  async removeIp(zoneId: string, ipId: string) {
    const entry = await this.prisma.zoneIpEntry.findFirst({
      where: { id: ipId, zone_id: zoneId, deleted_at: null },
    });
    if (!entry) throw new NotFoundException(`IP entry ${ipId} not found in zone ${zoneId}`);
    await this.prisma.zoneIpEntry.update({ where: { id: ipId }, data: { deleted_at: new Date() } });
    return { message: 'IP entry removed' };
  }
}
