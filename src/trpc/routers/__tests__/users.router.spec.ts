import { Test, TestingModule } from '@nestjs/testing';
import { TRPCError } from '@trpc/server';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRouter } from '../users.router';
import { UsersService } from 'src/modules/users/users.service';
import { TRPCAdapter } from 'src/trpc/trpc.adapter';

function createMockProcedure() {
  const input = jest.fn().mockReturnThis();
  const query = jest.fn((handler) => ({ type: 'query' as const, handler }));
  const mutation = jest.fn(
    (handler) => ({ type: 'mutation' as const, handler }) as const,
  );
  return { input, query, mutation };
}

function createMockAdapter() {
  const procedure = createMockProcedure();
  const protectedProcedure = createMockProcedure();
  const adminProcedure = createMockProcedure();
  return {
    t: { router: jest.fn((routes) => routes) },
    procedure,
    protectedProcedure,
    adminProcedure,
  };
}

describe('UsersRouter', () => {
  let router: UsersRouter;
  let usersService: jest.Mocked<UsersService>;
  let adapter: ReturnType<typeof createMockAdapter>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCtx = {
    ctx: {
      user: { id: 'user-1', email: 'test@example.com', role: 'USER' as const },
    },
  };

  beforeEach(async () => {
    adapter = createMockAdapter();

    const mockService = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      changePassword: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRouter,
        { provide: UsersService, useValue: mockService },
        { provide: TRPCAdapter, useValue: adapter },
      ],
    }).compile();

    router = module.get<UsersRouter>(UsersRouter);
    usersService = module.get(UsersService);
  });

  describe('procedure registration', () => {
    it('should register getProfile, updateProfile, changePassword with protectedProcedure', () => {
      const routes = router.router;
      expect(routes).toHaveProperty('getProfile');
      expect(routes).toHaveProperty('updateProfile');
      expect(routes).toHaveProperty('changePassword');
      expect(adapter.protectedProcedure.query).toHaveBeenCalledTimes(1);
      expect(adapter.protectedProcedure.mutation).toHaveBeenCalledTimes(2);
      expect(adapter.procedure.query).not.toHaveBeenCalled();
      expect(adapter.procedure.mutation).not.toHaveBeenCalled();
      expect(adapter.adminProcedure.query).not.toHaveBeenCalled();
      expect(adapter.adminProcedure.mutation).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user from service using ctx.user.id', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await router.router.getProfile.handler(mockCtx);

      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw TRPCError NOT_FOUND if user not found', async () => {
      usersService.findOne.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        router.router.getProfile.handler(mockCtx),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('updateProfile', () => {
    const updateDto = { firstName: 'Updated', lastName: 'Name' };

    it('should update user fields', async () => {
      usersService.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
      });

      const result = await router.router.updateProfile.handler({
        ...mockCtx,
        input: updateDto,
      });

      expect(usersService.update).toHaveBeenCalledWith('user-1', updateDto);
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    it('should throw TRPCError CONFLICT on email conflict', async () => {
      usersService.update.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(
        router.router.updateProfile.handler({
          ...mockCtx,
          input: { email: 'taken@example.com' },
        }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('should throw TRPCError NOT_FOUND', async () => {
      usersService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        router.router.updateProfile.handler({ ...mockCtx, input: updateDto }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('changePassword', () => {
    const passwordDto = {
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456!',
    };

    it('should call usersService.changePassword with user id and dto', async () => {
      usersService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const result = await router.router.changePassword.handler({
        ...mockCtx,
        input: passwordDto,
      });

      expect(usersService.changePassword).toHaveBeenCalledWith(
        'user-1',
        passwordDto,
      );
      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw TRPCError CONFLICT on wrong current password', async () => {
      usersService.changePassword.mockRejectedValue(
        new ConflictException('Current password is incorrect'),
      );

      await expect(
        router.router.changePassword.handler({
          ...mockCtx,
          input: passwordDto,
        }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });
});
