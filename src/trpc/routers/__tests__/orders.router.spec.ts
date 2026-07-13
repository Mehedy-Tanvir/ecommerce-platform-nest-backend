import { Test, TestingModule } from '@nestjs/testing';
import { TRPCError } from '@trpc/server';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersRouter } from '../orders.router';
import { OrdersService } from 'src/modules/orders/orders.service';
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

describe('OrdersRouter', () => {
  let router: OrdersRouter;
  let ordersService: jest.Mocked<OrdersService>;
  let adapter: ReturnType<typeof createMockAdapter>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'USER' as const,
  };
  const mockCtx = { ctx: { user: mockUser } };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    orderNumber: 'ORD-001',
    status: 'PENDING',
    totalAmount: 99.98,
    shippingAddress: '123 Main St',
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [
      {
        id: 'oi-1',
        productId: 'prod-1',
        quantity: 2,
        price: 49.99,
      },
    ],
  };

  beforeEach(async () => {
    adapter = createMockAdapter();

    const mockService = {
      create: jest.fn(),
      findAllForUser: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersRouter,
        { provide: OrdersService, useValue: mockService },
        { provide: TRPCAdapter, useValue: adapter },
      ],
    }).compile();

    router = module.get<OrdersRouter>(OrdersRouter);
    ordersService = module.get(OrdersService);
  });

  describe('procedure registration', () => {
    it('should register create, getMyOrders, getById, cancel with protectedProcedure', () => {
      const routes = router.router;
      expect(routes).toHaveProperty('create');
      expect(routes).toHaveProperty('getMyOrders');
      expect(routes).toHaveProperty('getById');
      expect(routes).toHaveProperty('cancel');
      expect(adapter.protectedProcedure.mutation).toHaveBeenCalledTimes(2);
      expect(adapter.protectedProcedure.query).toHaveBeenCalledTimes(2);
      expect(adapter.procedure.query).not.toHaveBeenCalled();
      expect(adapter.procedure.mutation).not.toHaveBeenCalled();
      expect(adapter.adminProcedure.query).not.toHaveBeenCalled();
      expect(adapter.adminProcedure.mutation).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createDto = {
      items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }],
      shippingAddress: '123 Main St',
    };

    it('should require auth and create order', async () => {
      const resultData = { success: true, data: mockOrder };
      ordersService.create.mockResolvedValue(resultData);

      const result = await router.router.create.handler({
        ...mockCtx,
        input: createDto,
      });

      expect(ordersService.create).toHaveBeenCalledWith('user-1', createDto);
      expect(result).toEqual(resultData);
    });

    it('should throw TRPCError BAD_REQUEST on invalid items', async () => {
      ordersService.create.mockRejectedValue(
        new BadRequestException('Invalid items'),
      );

      await expect(
        router.router.create.handler({ ...mockCtx, input: createDto }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });

  describe('getMyOrders', () => {
    const paginatedResult = {
      data: [mockOrder],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    it('should return paginated orders for current user', async () => {
      ordersService.findAllForUser.mockResolvedValue(paginatedResult);

      const result = await router.router.getMyOrders.handler({
        ...mockCtx,
        input: { page: 1, limit: 10 },
      });

      expect(ordersService.findAllForUser).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getById', () => {
    it('should return single order for user', async () => {
      ordersService.findOne.mockResolvedValue(mockOrder);

      const result = await router.router.getById.handler({
        ...mockCtx,
        input: 'order-1',
      });

      expect(ordersService.findOne).toHaveBeenCalledWith('order-1', 'user-1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw TRPCError NOT_FOUND', async () => {
      ordersService.findOne.mockRejectedValue(
        new NotFoundException('Order not found'),
      );

      await expect(
        router.router.getById.handler({ ...mockCtx, input: 'invalid' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('cancel', () => {
    it('should cancel order for current user', async () => {
      const cancelledOrder = { ...mockOrder, status: 'CANCELLED' };
      ordersService.cancel.mockResolvedValue({ data: cancelledOrder });

      const result = await router.router.cancel.handler({
        ...mockCtx,
        input: 'order-1',
      });

      expect(ordersService.cancel).toHaveBeenCalledWith('order-1', 'user-1');
      expect(result.data.status).toBe('CANCELLED');
    });

    it('should throw TRPCError BAD_REQUEST if order not cancellable', async () => {
      ordersService.cancel.mockRejectedValue(
        new BadRequestException('Order cannot be cancelled'),
      );

      await expect(
        router.router.cancel.handler({ ...mockCtx, input: 'order-1' }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('should throw TRPCError NOT_FOUND', async () => {
      ordersService.cancel.mockRejectedValue(
        new NotFoundException('Order not found'),
      );

      await expect(
        router.router.cancel.handler({ ...mockCtx, input: 'invalid' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
