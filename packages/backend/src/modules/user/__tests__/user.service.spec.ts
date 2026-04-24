import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserService } from '../user.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userRole: {
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  refreshToken: {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [{ id: '1', email: 'a@b.com', user_roles: [], user_group_members: [] }];
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any);

      expect(result.data).toEqual(users);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 'uuid-1', email: 'test@example.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const created = { id: 'new-uuid', email: 'new@example.com', full_name: 'New User', user_roles: [{ role: 'VIEWER' }] };
      mockPrisma.user.create.mockResolvedValue(created);

      const result = await service.create({ email: 'new@example.com', full_name: 'New User', password: 'Password@123' });
      expect(result).toEqual(created);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ email: 'existing@example.com', full_name: 'X', password: 'Password@123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const existing = { id: 'uuid-1', email: 'test@test.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(existing);
      const updated = { ...existing, full_name: 'Updated Name' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { full_name: 'Updated Name' });
      expect(result.full_name).toBe('Updated Name');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', { full_name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRole', () => {
    it('should assign a role to user', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', user_roles: [{ role: 'VIEWER' }], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.userRole.findFirst.mockResolvedValue(null);
      mockPrisma.userRole.create.mockResolvedValue({ id: 'role-id', role: 'OPERATOR' });

      const result = await service.assignRole('uuid-1', { role: 'OPERATOR' });
      expect(mockPrisma.userRole.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when user already has role', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.userRole.findFirst.mockResolvedValue({ id: 'existing-role', role: 'OPERATOR' });

      await expect(service.assignRole('uuid-1', { role: 'OPERATOR' })).rejects.toThrow(ConflictException);
    });
  });

  describe('removeRole', () => {
    it('should remove a role from user', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.userRole.findFirst.mockResolvedValue({ id: 'role-id', role: 'OPERATOR' });
      mockPrisma.userRole.delete.mockResolvedValue({});

      await service.removeRole('uuid-1', 'OPERATOR');
      expect(mockPrisma.userRole.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user does not have the role', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.userRole.findFirst.mockResolvedValue(null);

      await expect(service.removeRole('uuid-1', 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('should prevent removing last ADMIN role', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.userRole.findFirst.mockResolvedValue({ id: 'role-id', role: 'ADMIN' });
      mockPrisma.userRole.count.mockResolvedValue(1);

      await expect(service.removeRole('uuid-1', 'ADMIN')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and revoke refresh tokens', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.resetPassword('uuid-1', { new_password: 'NewPass@123' });
      expect(result.message).toBe('Password reset successfully');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLoginHistory', () => {
    it('should return paginated login history', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', user_roles: [], user_group_members: [] };
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockPrisma.refreshToken.findMany.mockResolvedValue([{ id: 'token-1', created_at: new Date() }]);
      mockPrisma.refreshToken.count.mockResolvedValue(1);

      const result = await service.getLoginHistory('uuid-1', 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getEffectiveRoles', () => {
    it('should return ADMIN when user has direct ADMIN role', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        user_roles: [{ role: 'ADMIN' }],
        user_group_members: [],
      });

      const roles = await service.getEffectiveRoles('uuid-1');
      expect(roles).toContain('ADMIN');
    });

    it('should include group roles in effective roles', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        user_roles: [{ role: 'VIEWER' }],
        user_group_members: [
          { group: { default_role: 'OPERATOR', status: 'ACTIVE' } },
        ],
      });

      const roles = await service.getEffectiveRoles('uuid-1');
      expect(roles).toContain('VIEWER');
      expect(roles).toContain('OPERATOR');
    });

    it('should exclude roles from inactive groups', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        user_roles: [{ role: 'VIEWER' }],
        user_group_members: [
          { group: { default_role: 'ADMIN', status: 'INACTIVE' } },
        ],
      });

      const roles = await service.getEffectiveRoles('uuid-1');
      expect(roles).not.toContain('ADMIN');
    });
  });
});
