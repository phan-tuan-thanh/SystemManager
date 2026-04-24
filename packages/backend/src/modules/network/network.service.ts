import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNetworkConfigDto } from './dto/create-network-config.dto';
import { UpdateNetworkConfigDto } from './dto/update-network-config.dto';
import { QueryNetworkConfigDto } from './dto/query-network-config.dto';

const NETWORK_SELECT = {
  id: true,
  server_id: true,
  interface: true,
  private_ip: true,
  public_ip: true,
  nat_ip: true,
  domain: true,
  subnet: true,
  gateway: true,
  dns: true,
  created_at: true,
  updated_at: true,
  server: {
    select: { id: true, code: true, name: true, environment: true },
  },
} as const;

@Injectable()
export class NetworkService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryNetworkConfigDto) {
    // Build base where
    const serverWhere: any = { deleted_at: null };
    if (query.environment) serverWhere.environment = query.environment;

    const where: any = {
      deleted_at: null,
      server: serverWhere,
      ...(query.server_id && { server_id: query.server_id }),
      ...(query.ip && {
        OR: [
          { private_ip: { contains: query.ip, mode: 'insensitive' as const } },
          { public_ip: { contains: query.ip, mode: 'insensitive' as const } },
          { nat_ip: { contains: query.ip, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.search && {
        domain: { contains: query.search, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.networkConfig.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'created_at']: query.sortOrder },
        select: NETWORK_SELECT,
      }),
      this.prisma.networkConfig.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const config = await this.prisma.networkConfig.findFirst({
      where: { id, deleted_at: null },
      select: NETWORK_SELECT,
    });
    if (!config) throw new NotFoundException('Network config not found');
    return config;
  }

  async create(dto: CreateNetworkConfigDto) {
    // Verify server exists
    const server = await this.prisma.server.findFirst({
      where: { id: dto.server_id, deleted_at: null },
      select: { id: true, environment: true },
    });
    if (!server) throw new NotFoundException('Server not found');

    // IP conflict detection: same environment + same private_ip
    if (dto.private_ip) {
      await this.checkIpConflict(dto.private_ip, server.environment, null);
    }

    const config = await this.prisma.networkConfig.create({
      data: {
        server_id: dto.server_id,
        interface: dto.interface,
        private_ip: dto.private_ip,
        public_ip: dto.public_ip,
        nat_ip: dto.nat_ip,
        domain: dto.domain,
        subnet: dto.subnet,
        gateway: dto.gateway,
        dns: dto.dns ?? [],
      },
      select: NETWORK_SELECT,
    });

    return config;
  }

  async update(id: string, dto: UpdateNetworkConfigDto) {
    const existing = await this.findOne(id);

    // If changing private_ip, check conflict
    if (dto.private_ip && dto.private_ip !== existing.private_ip) {
      await this.checkIpConflict(
        dto.private_ip,
        existing.server.environment,
        id,
      );
    }

    const config = await this.prisma.networkConfig.update({
      where: { id },
      data: {
        ...(dto.interface !== undefined && { interface: dto.interface }),
        ...(dto.private_ip !== undefined && { private_ip: dto.private_ip }),
        ...(dto.public_ip !== undefined && { public_ip: dto.public_ip }),
        ...(dto.nat_ip !== undefined && { nat_ip: dto.nat_ip }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.subnet !== undefined && { subnet: dto.subnet }),
        ...(dto.gateway !== undefined && { gateway: dto.gateway }),
        ...(dto.dns !== undefined && { dns: dto.dns }),
      },
      select: NETWORK_SELECT,
    });

    return config;
  }

  async remove(id: string) {
    const config = await this.prisma.networkConfig.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, server_id: true },
    });
    if (!config) throw new NotFoundException('Network config not found');

    const runningDeployments = await this.prisma.appDeployment.count({
      where: {
        server_id: config.server_id,
        deleted_at: null,
        status: 'RUNNING',
      },
    });

    if (runningDeployments > 0) {
      throw new ConflictException(
        `Network config đang được dùng bởi server có ${runningDeployments} ứng dụng đang triển khai`,
      );
    }

    await this.prisma.networkConfig.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Network config deleted successfully' };
  }

  async lookupDomain(domain: string) {
    const configs = await this.prisma.networkConfig.findMany({
      where: {
        deleted_at: null,
        domain: { contains: domain, mode: 'insensitive' },
      },
      select: {
        id: true,
        domain: true,
        private_ip: true,
        public_ip: true,
        server: {
          select: {
            id: true,
            code: true,
            name: true,
            environment: true,
            status: true,
            app_deployments: {
              where: { deleted_at: null },
              select: {
                id: true,
                version: true,
                status: true,
                environment: true,
                application: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });

    return configs;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async checkIpConflict(
    ip: string,
    environment: string,
    excludeId: string | null,
  ) {
    const conflict = await this.prisma.networkConfig.findFirst({
      where: {
        deleted_at: null,
        private_ip: ip,
        id: excludeId ? { not: excludeId } : undefined,
        server: { deleted_at: null, environment: environment as any },
      },
      select: { id: true, server: { select: { code: true, name: true } } },
    });

    if (conflict) {
      throw new ConflictException(
        `IP ${ip} is already assigned to server ${conflict.server.name} (${conflict.server.code}) in ${environment} environment`,
      );
    }
  }
}
