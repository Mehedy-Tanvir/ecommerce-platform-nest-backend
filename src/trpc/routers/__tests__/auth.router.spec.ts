import { Test, TestingModule } from '@nestjs/testing';
import { TRPCError } from '@trpc/server';
import {
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthRouter } from '../auth.router';
import { AuthService } from 'src/modules/auth/auth.service';
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

describe('AuthRouter', () => {
  let router: AuthRouter;
  let authService: jest.Mocked<AuthService>;
  let adapter: ReturnType<typeof createMockAdapter>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as const,
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: mockUser,
  };

  beforeEach(async () => {
    adapter = createMockAdapter();

    const mockService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRouter,
        { provide: AuthService, useValue: mockService },
        { provide: TRPCAdapter, useValue: adapter },
      ],
    }).compile();

    router = module.get<AuthRouter>(AuthRouter);
    authService = module.get(AuthService);
  });

  describe('procedure registration', () => {
    it('should register register, login, refresh, logout, me with correct auth guards', () => {
      const routes = router.router;
      expect(routes).toHaveProperty('register');
      expect(routes).toHaveProperty('login');
      expect(routes).toHaveProperty('refresh');
      expect(routes).toHaveProperty('logout');
      expect(routes).toHaveProperty('me');
      expect(adapter.procedure.mutation).toHaveBeenCalledTimes(2);
      expect(adapter.protectedProcedure.mutation).toHaveBeenCalledTimes(2);
      expect(adapter.protectedProcedure.query).toHaveBeenCalledTimes(1);
      expect(adapter.adminProcedure.query).not.toHaveBeenCalled();
      expect(adapter.adminProcedure.mutation).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create user and return tokens', async () => {
      authService.register.mockResolvedValue(mockTokens);

      const result = await router.router.register.handler({
        input: registerDto,
      });

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.accessToken).toBe('access-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should throw TRPCError CONFLICT on duplicate email', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(
        router.router.register.handler({ input: registerDto }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should return tokens for valid credentials', async () => {
      authService.login.mockResolvedValue(mockTokens);

      const result = await router.router.login.handler({ input: loginDto });

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw TRPCError UNAUTHORIZED for invalid email', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        router.router.login.handler({ input: loginDto }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should throw TRPCError UNAUTHORIZED for invalid password', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        router.router.login.handler({ input: loginDto }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should throw TRPCError INTERNAL_SERVER_ERROR for server error', async () => {
      authService.login.mockRejectedValue(
        new InternalServerErrorException('Server error'),
      );

      await expect(
        router.router.login.handler({ input: loginDto }),
      ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    });
  });

  describe('refresh', () => {
    const mockCtx = {
      ctx: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER' as const,
        },
      },
    };

    it('should call authService.refreshTokens with user id', async () => {
      authService.refreshTokens.mockResolvedValue(mockTokens);

      const result = await router.router.refresh.handler(mockCtx);

      expect(authService.refreshTokens).toHaveBeenCalledWith('user-1');
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw TRPCError UNAUTHORIZED if user not found', async () => {
      authService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      await expect(
        router.router.refresh.handler(mockCtx),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });

  describe('logout', () => {
    const mockCtx = {
      ctx: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER' as const,
        },
      },
    };

    it('should call authService.logout with user id', async () => {
      authService.logout.mockResolvedValue(undefined);

      await router.router.logout.handler(mockCtx);

      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });
  });

  describe('me', () => {
    const mockCtx = {
      ctx: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'ADMIN' as const,
        },
      },
    };

    it('should return current user from context', async () => {
      const result = await router.router.me.handler(mockCtx);

      expect(result).toEqual(mockCtx.ctx.user);
    });
  });
});
