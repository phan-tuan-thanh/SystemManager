import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    const where = {
      deleted_at: null,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { full_name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy || 'username']: query.sortBy ? query.sortOrder : 'asc' },
        select: {
          id: true,
          email: true,
          full_name: true,
          avatar_url: true,
          account_type: true,
          status: true,
          last_login_at: true,
          created_at: true,
          user_roles: { select: { role: true } },
          user_group_members: {
            select: { group: { select: { id: true, name: true, code: true } } },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        account_type: true,
        status: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        user_roles: { select: { id: true, role: true } },
        user_group_members: {
          select: {
            group: { select: { id: true, name: true, code: true, default_role: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(userId: string) {
    return this.findOne(userId);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        full_name: dto.full_name,
        password_hash: passwordHash,
        account_type: 'LOCAL',
        status: dto.status || 'ACTIVE',
        user_roles: {
          create: { role: 'VIEWER' },
        },
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        account_type: true,
        status: true,
        created_at: true,
        user_roles: { select: { role: true } },
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.full_name !== undefined && { full_name: dto.full_name }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.avatar_url !== undefined && { avatar_url: dto.avatar_url }),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        account_type: true,
        status: true,
        updated_at: true,
        user_roles: { select: { role: true } },
      },
    });

    return user;
  }

  async assignRole(userId: string, dto: AssignRoleDto) {
    await this.findOne(userId);

    const existing = await this.prisma.userRole.findFirst({
      where: { user_id: userId, role: dto.role },
    });

    if (existing) {
      throw new ConflictException(`User already has role '${dto.role}'`);
    }

    await this.prisma.userRole.create({
      data: { user_id: userId, role: dto.role },
    });

    return this.findOne(userId);
  }

  async removeRole(userId: string, role: string) {
    await this.findOne(userId);

    const userRole = await this.prisma.userRole.findFirst({
      where: { user_id: userId, role: role as any },
    });

    if (!userRole) {
      throw new NotFoundException(`User does not have role '${role}'`);
    }

    // Prevent removing the last ADMIN role if this is the only admin
    if (role === 'ADMIN') {
      const adminCount = await this.prisma.userRole.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last ADMIN role in the system');
      }
    }

    await this.prisma.userRole.delete({ where: { id: userRole.id } });

    return this.findOne(userId);
  }

  async resetPassword(userId: string, dto: ResetPasswordDto) {
    await this.findOne(userId);

    const passwordHash = await bcrypt.hash(dto.new_password, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: passwordHash },
    });

    // Revoke all refresh tokens to force re-login
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  async getLoginHistory(userId: string, page = 1, limit = 20) {
    await this.findOne(userId);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.refreshToken.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          ip_address: true,
          user_agent: true,
          created_at: true,
          expires_at: true,
          revoked_at: true,
        },
      }),
      this.prisma.refreshToken.count({ where: { user_id: userId } }),
    ]);

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async getEffectiveRoles(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
      select: {
        user_roles: { select: { role: true } },
        user_group_members: {
          select: {
            group: { select: { default_role: true, status: true } },
          },
        },
      },
    });

    if (!user) return [];

    const directRoles = user.user_roles.map((ur) => ur.role as string);
    const groupRoles = user.user_group_members
      .filter((m) => m.group.status === 'ACTIVE')
      .map((m) => m.group.default_role as string);

    // Role hierarchy: ADMIN > OPERATOR > VIEWER
    const allRoles = new Set([...directRoles, ...groupRoles]);

    if (allRoles.has('ADMIN')) return ['ADMIN'];
    if (allRoles.has('OPERATOR')) return ['OPERATOR'];
    return ['VIEWER'];
  }
}
