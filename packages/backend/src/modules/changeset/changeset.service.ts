import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PreviewEngineService } from './changeset.preview-engine';
import { CreateChangeSetDto } from './dto/create-changeset.dto';
import { CreateChangeItemDto } from './dto/create-change-item.dto';
import { QueryChangeSetDto } from './dto/query-changeset.dto';

const CREATOR_SELECT = { id: true, full_name: true, email: true };

@Injectable()
export class ChangeSetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly previewEngine: PreviewEngineService,
  ) {}

  async create(dto: CreateChangeSetDto, userId: string) {
    return this.prisma.changeSet.create({
      data: {
        title: dto.title,
        description: dto.description,
        environment: dto.environment,
        created_by: userId,
        status: 'DRAFT',
      },
      include: {
        creator: { select: CREATOR_SELECT },
        items: true,
        _count: { select: { items: true } },
      },
    });
  }

  async findAll(query: QueryChangeSetDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.environment) where.environment = query.environment;
    if (query.created_by) where.created_by = query.created_by;

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { created_at: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.changeSet.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          creator: { select: CREATOR_SELECT },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.changeSet.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async findOne(id: string) {
    const cs = await this.prisma.changeSet.findUnique({
      where: { id },
      include: {
        creator: { select: CREATOR_SELECT },
        items: { orderBy: { created_at: 'asc' } },
        _count: { select: { items: true } },
      },
    });
    if (!cs) throw new NotFoundException(`ChangeSet ${id} not found`);
    return cs;
  }

  async discard(id: string) {
    const cs = await this.prisma.changeSet.findUnique({ where: { id } });
    if (!cs) throw new NotFoundException(`ChangeSet ${id} not found`);
    if (cs.status === 'APPLIED') throw new BadRequestException('Cannot discard an already applied ChangeSet');
    if (cs.status === 'DISCARDED') throw new BadRequestException('ChangeSet is already discarded');

    return this.prisma.changeSet.update({
      where: { id },
      data: { status: 'DISCARDED' },
      include: { creator: { select: CREATOR_SELECT }, _count: { select: { items: true } } },
    });
  }

  async addItem(changesetId: string, dto: CreateChangeItemDto) {
    const cs = await this.prisma.changeSet.findUnique({ where: { id: changesetId } });
    if (!cs) throw new NotFoundException(`ChangeSet ${changesetId} not found`);
    if (cs.status !== 'DRAFT') throw new BadRequestException('Can only add items to a DRAFT ChangeSet');

    return this.prisma.changeItem.create({
      data: {
        changeset_id: changesetId,
        resource_type: dto.resource_type,
        resource_id: dto.resource_id ?? null,
        action: dto.action,
        old_value: dto.old_value as any ?? null,
        new_value: dto.new_value as any ?? null,
      },
    });
  }

  async removeItem(changesetId: string, itemId: string) {
    const cs = await this.prisma.changeSet.findUnique({ where: { id: changesetId } });
    if (!cs) throw new NotFoundException(`ChangeSet ${changesetId} not found`);
    if (cs.status !== 'DRAFT') throw new BadRequestException('Can only remove items from a DRAFT ChangeSet');

    const item = await this.prisma.changeItem.findFirst({
      where: { id: itemId, changeset_id: changesetId },
    });
    if (!item) throw new NotFoundException(`ChangeItem ${itemId} not found in ChangeSet ${changesetId}`);

    await this.prisma.changeItem.delete({ where: { id: itemId } });
  }

  async preview(id: string) {
    const cs = await this.findOne(id);
    if (cs.status === 'APPLIED') throw new BadRequestException('ChangeSet is already applied');
    if (cs.status === 'DISCARDED') throw new BadRequestException('ChangeSet is discarded');

    // Transition to PREVIEWING so UI knows a preview is in progress
    await this.prisma.changeSet.update({ where: { id }, data: { status: 'PREVIEWING' } });

    return this.previewEngine.compute({
      id: cs.id,
      environment: cs.environment,
      items: cs.items as any,
    });
  }

  async apply(id: string, userId: string) {
    const cs = await this.findOne(id);
    if (cs.status === 'APPLIED') throw new BadRequestException('ChangeSet is already applied');
    if (cs.status === 'DISCARDED') throw new BadRequestException('ChangeSet is discarded');
    if (cs.items.length === 0) throw new BadRequestException('ChangeSet has no items to apply');

    // Guard: check for fatal conflicts before applying
    const preview = await this.previewEngine.compute({
      id: cs.id,
      environment: cs.environment,
      items: cs.items as any,
    });
    const fatalConflicts = (preview.conflicts as any[]).filter((c) => c.severity === 'ERROR');
    if (fatalConflicts.length > 0) {
      throw new ConflictException({ message: 'Fatal conflicts must be resolved before applying', conflicts: fatalConflicts });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of cs.items) {
        await this._applyItem(tx as any, item as any);
      }

      await tx.changeSet.update({
        where: { id },
        data: { status: 'APPLIED', applied_at: new Date() },
      });

      // Auto-snapshot: capture topology state post-apply
      const topologyPayload = await this._buildTopologyPayload(tx as any, cs.environment ?? undefined);
      await tx.topologySnapshot.create({
        data: {
          label: `Auto-snapshot: ${cs.title}`,
          environment: cs.environment ?? null,
          payload: topologyPayload as any,
          created_by: userId,
        },
      });
    });

    return this.findOne(id);
  }

  private async _applyItem(tx: any, item: { resource_type: string; resource_id: string | null; action: string; new_value: any }) {
    const data = item.new_value ?? {};
    const id = item.resource_id;

    const applyResource = async (model: any) => {
      if (item.action === 'CREATE') await model.create({ data });
      else if (item.action === 'UPDATE') await model.update({ where: { id }, data });
      else if (item.action === 'DELETE') await model.update({ where: { id }, data: { deleted_at: new Date() } });
    };

    switch (item.resource_type) {
      case 'SERVER':         await applyResource(tx.server); break;
      case 'APPLICATION':    await applyResource(tx.application); break;
      case 'NETWORK_CONFIG': await applyResource(tx.networkConfig); break;
      case 'PORT':           await applyResource(tx.port); break;
      case 'APP_CONNECTION': await applyResource(tx.appConnection); break;
      case 'APP_DEPLOYMENT': await applyResource(tx.appDeployment); break;
      default:
        throw new BadRequestException(`Unknown resource_type: ${item.resource_type}`);
    }
  }

  private async _buildTopologyPayload(tx: any, environment?: string) {
    const envFilter: any = environment ? { environment } : {};
    const [servers, connections] = await Promise.all([
      tx.server.findMany({
        where: { deleted_at: null, ...envFilter },
        include: {
          network_configs: { where: { deleted_at: null } },
          app_deployments: {
            where: { deleted_at: null },
            include: { application: { select: { id: true, code: true, name: true } } },
          },
        },
      }),
      tx.appConnection.findMany({
        where: { deleted_at: null, ...envFilter },
        include: {
          source_app: { select: { id: true, code: true, name: true } },
          target_app: { select: { id: true, code: true, name: true } },
        },
      }),
    ]);
    return { servers, connections, environment, captured_at: new Date().toISOString() };
  }
}
