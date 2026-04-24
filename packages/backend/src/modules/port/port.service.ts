import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePortDto } from './dto/create-port.dto';
import { UpdatePortDto } from './dto/update-port.dto';
import { QueryPortDto } from './dto/query-port.dto';

@Injectable()
export class PortService {
  constructor(private prisma: PrismaService) {}

  async list(query: QueryPortDto) {
    const where: any = { deleted_at: null };

    if (query.application_id) where.application_id = query.application_id;
    if (query.deployment_id) where.deployment_id = query.deployment_id;
    if (query.protocol) where.protocol = { contains: query.protocol, mode: 'insensitive' };
    if (query.port_number) where.port_number = query.port_number;

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { port_number: 'asc' as const };

    const [data, total] = await Promise.all([
      this.prisma.port.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          application: { select: { id: true, code: true, name: true } },
          deployment: {
            select: {
              id: true,
              version: true,
              environment: true,
              server: { select: { id: true, code: true, name: true } },
            },
          },
        },
      }),
      this.prisma.port.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const port = await this.prisma.port.findFirst({
      where: { id, deleted_at: null },
      include: {
        application: true,
        deployment: { include: { server: true } },
      },
    });
    if (!port) throw new NotFoundException(`Port ${id} not found`);
    return port;
  }

  async create(dto: CreatePortDto) {
    const application = await this.prisma.application.findFirst({
      where: { id: dto.application_id, deleted_at: null },
    });
    if (!application) throw new NotFoundException(`Application ${dto.application_id} not found`);

    const protocol = dto.protocol ?? 'TCP';

    if (dto.deployment_id) {
      await this.checkConflict(dto.deployment_id, dto.port_number, protocol);
    }

    return this.prisma.port.create({ data: { ...dto, protocol } });
  }

  async update(id: string, dto: UpdatePortDto) {
    const port = await this.prisma.port.findFirst({ where: { id, deleted_at: null } });
    if (!port) throw new NotFoundException(`Port ${id} not found`);

    const deploymentId = dto.deployment_id ?? port.deployment_id;
    const portNumber = dto.port_number ?? port.port_number;
    const protocol = dto.protocol ?? port.protocol;

    if (deploymentId && (dto.port_number || dto.protocol || dto.deployment_id)) {
      await this.checkConflict(deploymentId, portNumber, protocol, id);
    }

    return this.prisma.port.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const port = await this.prisma.port.findFirst({ where: { id, deleted_at: null } });
    if (!port) throw new NotFoundException(`Port ${id} not found`);
    await this.prisma.port.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /**
   * Port conflict: same server (via deployment) + same port_number + same protocol
   */
  private async checkConflict(
    deploymentId: string,
    portNumber: number,
    protocol: string,
    excludePortId?: string,
  ) {
    // Get server_id from deployment
    const deployment = await this.prisma.appDeployment.findFirst({
      where: { id: deploymentId, deleted_at: null },
      select: { server_id: true },
    });
    if (!deployment) throw new NotFoundException(`Deployment ${deploymentId} not found`);

    const serverId = deployment.server_id;

    // Find any other port with same port_number+protocol on same server
    const conflict = await this.prisma.port.findFirst({
      where: {
        port_number: portNumber,
        protocol: { equals: protocol, mode: 'insensitive' },
        deleted_at: null,
        id: excludePortId ? { not: excludePortId } : undefined,
        deployment: {
          server_id: serverId,
          deleted_at: null,
        },
      },
      include: {
        application: { select: { code: true, name: true } },
        deployment: { select: { server: { select: { name: true } } } },
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Port ${portNumber}/${protocol} is already in use on server '${conflict.deployment?.server?.name}' by application '${conflict.application?.name}'`,
      );
    }
  }
}
