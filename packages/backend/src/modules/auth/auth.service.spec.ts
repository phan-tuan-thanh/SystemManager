import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userRole: {
        count: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('7d'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = mockPrisma;
  });

  describe('hasAdminUser', () => {
    it('should return true when admin exists', async () => {
      prisma.userRole.count.mockResolvedValue(1);
      const result = await service.hasAdminUser();
      expect(result).toBe(true);
    });

    it('should return false when no admin exists', async () => {
      prisma.userRole.count.mockResolvedValue(0);
      const result = await service.hasAdminUser();
      expect(result).toBe(false);
    });
  });

  describe('validateUser - first admin creation', () => {
    it('should create first admin user when no admin exists', async () => {
      // Mock no existing user and no admin
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.userRole.count.mockResolvedValue(0);

      const mockCreatedUser = {
        id: 'user-1',
        email: 'admin@test.com',
        full_name: 'admin',
        password_hash: 'hashed-password',
        status: 'ACTIVE',
        user_roles: [{ role: 'ADMIN' }],
      };

      prisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.validateUser('admin@test.com', 'password123');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'admin@test.com',
          full_name: 'admin',
          password_hash: expect.any(String),
          account_type: 'LOCAL',
          status: 'ACTIVE',
          user_roles: {
            create: { role: 'ADMIN' },
          },
        },
        include: { user_roles: true },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should reject login when user not found and admin already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.userRole.count.mockResolvedValue(1);

      await expect(service.validateUser('user@test.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
