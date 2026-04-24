import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MS365Strategy } from './strategies/oidc.strategy';

// Using string literals instead of Prisma enums until client is generated
type Role = 'ADMIN' | 'OPERATOR' | 'VIEWER';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private ms365Strategy: MS365Strategy,
  ) {}

  async hasAdminUser(): Promise<boolean> {
    const adminCount = await this.prisma.userRole.count({
      where: { role: 'ADMIN' },
    });
    return adminCount > 0;
  }

  async validateUser(email: string, password: string) {
    let user = await this.prisma.user.findUnique({
      where: { email, deleted_at: null },
      include: { user_roles: true },
    });

    // If user doesn't exist and no admin exists yet, create first admin user
    if (!user) {
      const hasAdmin = await this.hasAdminUser();
      if (!hasAdmin) {
        // Create first admin user
        const passwordHash = await bcrypt.hash(password, 12);
        user = await this.prisma.user.create({
          data: {
            email,
            full_name: email.split('@')[0], // Use part before @ as name, or 'System Administrator'
            password_hash: passwordHash,
            account_type: 'LOCAL',
            status: 'ACTIVE',
            user_roles: {
              create: { role: 'ADMIN' },
            },
          },
          include: { user_roles: true },
        });
        return user;
      } else {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async computeEffectiveRoles(userId: string): Promise<string[]> {
    const userData = await this.prisma.user.findFirst({
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
    if (!userData) return [];

    const directRoles = userData.user_roles.map((ur) => ur.role as string);
    const groupRoles = userData.user_group_members
      .filter((m) => m.group.status === 'ACTIVE')
      .map((m) => m.group.default_role as string);

    // Role hierarchy: ADMIN > OPERATOR > VIEWER — store all unique roles
    const allRoles = Array.from(new Set([...directRoles, ...groupRoles]));
    return allRoles;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    const roles = await this.computeEffectiveRoles(user.id);
    const payload = { sub: user.id, email: user.email, roles };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        roles,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Only allow registration if admin already exists
    const hasAdmin = await this.hasAdminUser();
    if (!hasAdmin) {
      throw new UnauthorizedException(
        'System not initialized. Please login as first admin user first.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        full_name: dto.full_name,
        password_hash: passwordHash,
        account_type: 'LOCAL',
        user_roles: {
          create: { role: 'VIEWER' },
        },
      },
      include: { user_roles: true },
    });

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        token_hash: refreshToken,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      include: { user: { include: { user_roles: true } } },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked_at: new Date() },
    });

    const user = stored.user;
    const roles = await this.computeEffectiveRoles(user.id);
    const payload = { sub: user.id, email: user.email, roles };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
    });

    if (!user || !user.password_hash) {
      throw new BadRequestException('Cannot change password for this account');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    // Revoke all refresh tokens to force re-login
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    return { message: 'Password changed successfully' };
  }

  getMicrosoftLoginUrl(): string {
    return this.ms365Strategy.getAuthorizationUrl();
  }

  async loginWithMicrosoft(code: string) {
    const msAccessToken = await this.ms365Strategy.exchangeCode(code);
    const msUser = await this.ms365Strategy.getUserInfo(msAccessToken);

    const email = msUser.mail || msUser.userPrincipalName;
    const microsoftId = msUser.id;

    // Try find by microsoft_id first, then by email (for account linking)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { microsoft_id: microsoftId, deleted_at: null },
          { email, deleted_at: null },
        ],
      },
      include: { user_roles: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          full_name: msUser.displayName || email.split('@')[0],
          microsoft_id: microsoftId,
          account_type: 'MICROSOFT_365',
          status: 'ACTIVE',
          user_roles: { create: { role: 'VIEWER' } },
        },
        include: { user_roles: true },
      });
    } else if (!user.microsoft_id) {
      // Link SSO to existing local account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { microsoft_id: microsoftId },
        include: { user_roles: true },
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const roles = await this.computeEffectiveRoles(user.id);
    const payload = { sub: user.id, email: user.email, roles };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url, roles },
    };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = require('crypto').randomBytes(64).toString('hex');

    const expiresIn = this.config.get('JWT_REFRESH_EXPIRY', '7d');
    const expiresAt = new Date();
    const days = parseInt(expiresIn) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: token,
        expires_at: expiresAt,
      },
    });

    return token;
  }
}
