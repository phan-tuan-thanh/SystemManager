import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserGroupService } from '../user-group.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

const mockPrisma = {
  userGroup: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userGroupMember: {
    findMany: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

describe('UserGroupService', () => {
  let service: UserGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGroupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserGroupService>(UserGroupService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated user groups', async () => {
      const groups = [{ id: 'g1', code: 'DEV', name: 'Dev Team', _count: { members: 3 } }];
      mockPrisma.userGroup.findMany.mockResolvedValue(groups);
      mockPrisma.userGroup.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, sortOrder: 'desc', skip: 0 } as any);

      expect(result.data).toEqual(groups);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return a group by id', async () => {
      const group = { id: 'g1', code: 'DEV', name: 'Dev Team', _count: { members: 3 } };
      mockPrisma.userGroup.findFirst.mockResolvedValue(group);

      const result = await service.findOne('g1');
      expect(result).toEqual(group);
    });

    it('should throw NotFoundException when group does not exist', async () => {
      mockPrisma.userGroup.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user group', async () => {
      mockPrisma.userGroup.findUnique.mockResolvedValue(null);
      const created = { id: 'new-g', code: 'NEW', name: 'New Group', default_role: 'VIEWER', status: 'ACTIVE' };
      mockPrisma.userGroup.create.mockResolvedValue(created);

      const result = await service.create({ code: 'NEW', name: 'New Group' });
      expect(result).toEqual(created);
    });

    it('should throw ConflictException when code already exists', async () => {
      mockPrisma.userGroup.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create({ code: 'DEV', name: 'Dev Team' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update group fields', async () => {
      const existing = { id: 'g1', code: 'DEV', name: 'Dev Team', _count: { members: 0 } };
      mockPrisma.userGroup.findFirst.mockResolvedValue(existing);
      const updated = { ...existing, name: 'Updated Team' };
      mockPrisma.userGroup.update.mockResolvedValue(updated);

      const result = await service.update('g1', { name: 'Updated Team' });
      expect(result.name).toBe('Updated Team');
    });
  });

  describe('remove', () => {
    it('should soft-delete the group', async () => {
      const existing = { id: 'g1', code: 'DEV', name: 'Dev Team', _count: { members: 0 } };
      mockPrisma.userGroup.findFirst.mockResolvedValue(existing);
      mockPrisma.userGroup.update.mockResolvedValue({});

      const result = await service.remove('g1');
      expect(result.message).toBe('UserGroup deleted successfully');
      expect(mockPrisma.userGroup.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      });
    });
  });

  describe('getMembers', () => {
    it('should return paginated members', async () => {
      const group = { id: 'g1', _count: { members: 2 } };
      mockPrisma.userGroup.findFirst.mockResolvedValue(group);
      const members = [{ id: 'm1', user: { id: 'u1', email: 'a@b.com' } }];
      mockPrisma.userGroupMember.findMany.mockResolvedValue(members);
      mockPrisma.userGroupMember.count.mockResolvedValue(1);

      const result = await service.getMembers('g1', 1, 20);
      expect(result.data).toEqual(members);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('addMembers', () => {
    it('should add new members, skip existing', async () => {
      const group = { id: 'g1', _count: { members: 1 } };
      mockPrisma.userGroup.findFirst.mockResolvedValue(group);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
      mockPrisma.userGroupMember.findMany.mockResolvedValue([{ user_id: 'u1' }]);
      mockPrisma.userGroupMember.createMany.mockResolvedValue({ count: 1 });

      const result = await service.addMembers('g1', { user_ids: ['u1', 'u2'] });
      expect(result.added).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('should throw NotFoundException for missing users', async () => {
      const group = { id: 'g1', _count: { members: 0 } };
      mockPrisma.userGroup.findFirst.mockResolvedValue(group);
      mockPrisma.user.findMany.mockResolvedValue([]);

      await expect(
        service.addMembers('g1', { user_ids: ['non-existent-user'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMembers', () => {
    it('should remove specified members', async () => {
      const group = { id: 'g1', _count: { members: 2 } };
      mockPrisma.userGroup.findFirst.mockResolvedValue(group);
      mockPrisma.userGroupMember.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.removeMembers('g1', { user_ids: ['u1', 'u2'] });
      expect(result.removed).toBe(2);
    });
  });
});
