import { Test, TestingModule } from '@nestjs/testing';
import { TRPCRouter } from '../trpc.router';
import { TRPCAdapter } from '../trpc.adapter';
import { ProductsRouter } from '../routers/products.router';
import { CategoriesRouter } from '../routers/categories.router';
import { AuthRouter } from '../routers/auth.router';
import { OrdersRouter } from '../routers/orders.router';
import { UsersRouter } from '../routers/users.router';

describe('TRPCRouter (integration)', () => {
  let trpcRouter: TRPCRouter;

  const mockAdapter = {
    t: {
      router: jest.fn((routes: Record<string, unknown>) => routes),
    },
    procedure: { input: jest.fn(), query: jest.fn(), mutation: jest.fn() },
    protectedProcedure: {
      input: jest.fn(),
      query: jest.fn(),
      mutation: jest.fn(),
    },
    adminProcedure: { input: jest.fn(), query: jest.fn(), mutation: jest.fn() },
    getMiddleware: jest.fn(),
  };

  const mockProductsRouter = {
    router: {
      getAll: {},
      getById: {},
      create: {},
      update: {},
      updateStock: {},
      delete: {},
    },
  };

  const mockCategoriesRouter = {
    router: {
      getAll: {},
      getById: {},
      getBySlug: {},
      create: {},
      update: {},
      delete: {},
    },
  };

  const mockAuthRouter = {
    router: { register: {}, login: {}, refresh: {}, logout: {}, me: {} },
  };

  const mockOrdersRouter = {
    router: { create: {}, getMyOrders: {}, getById: {}, cancel: {} },
  };

  const mockUsersRouter = {
    router: { getProfile: {}, updateProfile: {}, changePassword: {} },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TRPCRouter,
        { provide: TRPCAdapter, useValue: mockAdapter },
        { provide: ProductsRouter, useValue: mockProductsRouter },
        { provide: CategoriesRouter, useValue: mockCategoriesRouter },
        { provide: AuthRouter, useValue: mockAuthRouter },
        { provide: OrdersRouter, useValue: mockOrdersRouter },
        { provide: UsersRouter, useValue: mockUsersRouter },
      ],
    }).compile();

    trpcRouter = module.get<TRPCRouter>(TRPCRouter);
  });

  describe('appRouter composition', () => {
    it('should merge all sub-routers into appRouter', () => {
      const appRouter = trpcRouter.appRouter;

      expect(appRouter).toHaveProperty('products');
      expect(appRouter).toHaveProperty('categories');
      expect(appRouter).toHaveProperty('auth');
      expect(appRouter).toHaveProperty('orders');
      expect(appRouter).toHaveProperty('users');
    });

    it('should have products router procedures', () => {
      const appRouter = trpcRouter.appRouter;
      expect(appRouter.products).toEqual(mockProductsRouter.router);
    });

    it('should have categories router procedures', () => {
      const appRouter = trpcRouter.appRouter;
      expect(appRouter.categories).toEqual(mockCategoriesRouter.router);
    });

    it('should have auth router procedures', () => {
      const appRouter = trpcRouter.appRouter;
      expect(appRouter.auth).toEqual(mockAuthRouter.router);
    });

    it('should have orders router procedures', () => {
      const appRouter = trpcRouter.appRouter;
      expect(appRouter.orders).toEqual(mockOrdersRouter.router);
    });

    it('should have users router procedures', () => {
      const appRouter = trpcRouter.appRouter;
      expect(appRouter.users).toEqual(mockUsersRouter.router);
    });

    it('should call adapter.t.router with the merged definitions', () => {
      const appRouter = trpcRouter.appRouter;

      expect(mockAdapter.t.router).toHaveBeenCalledTimes(1);
      const callArg = mockAdapter.t.router.mock.calls[0][0];
      expect(callArg).toHaveProperty('products');
      expect(callArg).toHaveProperty('categories');
      expect(callArg).toHaveProperty('auth');
      expect(callArg).toHaveProperty('orders');
      expect(callArg).toHaveProperty('users');
      expect(appRouter).toBeDefined();
    });
  });

  describe('AppRouter type', () => {
    it('should expose AppRouter type (compile-time check)', () => {
      const appRouter = trpcRouter.appRouter;
      const keys = Object.keys(appRouter);
      expect(keys).toEqual(
        expect.arrayContaining([
          'products',
          'categories',
          'auth',
          'orders',
          'users',
        ]),
      );
      expect(keys).toHaveLength(5);
    });
  });
});
