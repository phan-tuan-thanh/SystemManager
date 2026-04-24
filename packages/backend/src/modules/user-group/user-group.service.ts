import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryUserGroupDto } from './dto/query-user-group.dto';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { ManageMembersDto } from './dto/manage-members.dto';

@Injectable()
export class UserGroupService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUserGroupDto) {
    const where = {
      deleted_at: null,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { code: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.userGroup.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'name']: query.sortBy ? query.sortOrder : 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          default_role: true,
          leader_id: true,
          status: true,
          created_at: true,
          updated_at: true,
          _count: { select: { members: true } },
        },
      }),
      this.prisma.userGroup.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async findOne(id: string) {
    const group = await this.prisma.userGroup.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        default_role: true,
        leader_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('UserGroup not found');
    }

    return group;
  }

  async create(dto: CreateUserGroupDto) {
    const existing = await this.prisma.userGroup.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`UserGroup with code '${dto.code}' already exists`);
    }

    return this.prisma.userGroup.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        default_role: dto.default_role || 'VIEWER',
        leader_id: dto.leader_id,
        status: dto.status || 'ACTIVE',
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        default_role: true,
        leader_id: true,
        status: true,
        created_at: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserGroupDto) {
    await this.findOne(id);

    return this.prisma.userGroup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.default_role !== undefined && { default_role: dto.default_role }),
        ...(dto.leader_id !== undefined && { leader_id: dto.leader_id }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        default_role: true,
        leader_id: true,
        status: true,
        updated_at: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.userGroup.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'UserGroup deleted successfully' };
  }

  async getMembers(groupId: string, page = 1, limit = 20) {
    await this.findOne(groupId);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.userGroupMember.findMany({
        where: { group_id: groupId },
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          created_at: true,
          user: {
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
              status: true,
              user_roles: { select: { role: true } },
            },
          },
        },
      }),
      this.prisma.userGroupMember.count({ where: { group_id: groupId } }),
    ]);

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async addMembers(groupId: string, dto: ManageMembersDto) {
    await this.findOne(groupId);

    // Verify all users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: dto.user_ids }, deleted_at: null },
      select: { id: true },
    });
    const foundIds = new Set(users.map((u) => u.id));
    const missingIds = dto.user_ids.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(`Users not found: ${missingIds.join(', ')}`);
    }

    // Get existing memberships to avoid duplicates
    const existing = await this.prisma.userGroupMember.findMany({
      where: { group_id: groupId, user_id: { in: dto.user_ids } },
      select: { user_id: true },
    });
    const existingIds = new Set(existing.map((m) => m.user_id));
    const newUserIds = dto.user_ids.filter((id) => !existingIds.has(id));

    if (newUserIds.length > 0) {
      await this.prisma.userGroupMember.createMany({
        data: newUserIds.map((userId) => ({
          user_id: userId,
          group_id: groupId,
        })),
      });
    }

    return {
      added: newUserIds.length,
      skipped: existingIds.size,
      message: `Added ${newUserIds.length} member(s), ${existingIds.size} already existed`,
    };
  }

  async removeMembers(groupId: string, dto: ManageMembersDto) {
    await this.findOne(groupId);

    const result = await this.prisma.userGroupMember.deleteMany({
      where: {
        group_id: groupId,
        user_id: { in: dto.user_ids },
      },
    });

    return {
      removed: result.count,
      message: `Removed ${result.count} member(s)`,
    };
  }
}
