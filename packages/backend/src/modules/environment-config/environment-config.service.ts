import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEnvironmentConfigDto } from './dto/create-environment-config.dto';
import { UpdateEnvironmentConfigDto } from './dto/update-environment-config.dto';

const SYSTEM_DEFAULTS = ['DEV', 'UAT', 'PROD'];

@Injectable()
export class EnvironmentConfigService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(activeOnly = false) {
    return this.prisma.environmentConfig.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: [{ sort_order: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: string) {
    const env = await this.prisma.environmentConfig.findUnique({ where: { id } });
    if (!env) throw new NotFoundException(`Environment '${id}' not found`);
    return env;
  }

  async findByCode(code: string) {
    const env = await this.prisma.environmentConfig.findUnique({ where: { code } });
    if (!env) throw new NotFoundException(`Environment code '${code}' not found`);
    return env;
  }

  async create(dto: CreateEnvironmentConfigDto) {
    const existing = await this.prisma.environmentConfig.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Environment code '${dto.code}' already exists`);
    return this.prisma.environmentConfig.create({ data: dto });
  }

  async update(id: string, dto: UpdateEnvironmentConfigDto) {
    await this.findOne(id);
    return this.prisma.environmentConfig.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    const env = await this.findOne(id);
    if (SYSTEM_DEFAULTS.includes(env.code)) {
      throw new BadRequestException(`Cannot deactivate system default environment '${env.code}'`);
    }
    const inUse = await this.checkInUse(env.code);
    if (inUse) {
      throw new BadRequestException(
        `Environment '${env.code}' is still in use. Reassign all resources before deactivating.`,
      );
    }
    return this.prisma.environmentConfig.update({ where: { id }, data: { is_active: false } });
  }

  async reorder(codes: string[]) {
    const updates = codes.map((code, index) =>
      this.prisma.environmentConfig.updateMany({ where: { code }, data: { sort_order: index + 1 } }),
    );
    await this.prisma.$transaction(updates);
    return this.findAll();
  }

  private async checkInUse(code: string): Promise<boolean> {
    const [servers, deployments, connections, zones, firewalls] = await Promise.all([
      this.prisma.server.count({ where: { environment: code, deleted_at: null } }),
      this.prisma.appDeployment.count({ where: { environment: code, deleted_at: null } }),
      this.prisma.appConnection.count({ where: { environment: code, deleted_at: null } }),
      this.prisma.networkZone.count({ where: { environment: code, deleted_at: null } }),
      this.prisma.firewallRule.count({ where: { environment: code, deleted_at: null } }),
    ]);
    return servers + deployments + connections + zones + firewalls > 0;
  }
}
