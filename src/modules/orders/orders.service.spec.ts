import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';
import { OrderStatus, Prisma } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    price: new Prisma.Decimal(49.99),
    stock: 10,
    sku: 'TEST-001',
    description: null,
    imageUrl: null,
    isActive: true,
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    orderNumber: 'clx...',
    status: OrderStatus.PENDING,
    totalAmount: new Prisma.Decimal(99.98),
    cartId: null,
    shippingAddress: '123 Main St',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hash',
      role: 'USER',
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    orderItems: [
      {
        id: 'oi-1',
        productId: 'prod-1',
        orderId: 'order-1',
        quantity: 2,
        price: new Prisma.Decimal(49.99),
        createdAt: new Date(),
        updatedAt: new Date(),
        product: mockProduct,
      },
    ],
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;

    (prisma.$transaction as jest.Mock).mockImplementation(
      (fn: (tx: any) => any) => fn(prisma),
    );
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.cart.findFirst.mockResolvedValue(null);
      prisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.create('user-1', {
        items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }],
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
    });

    it('should throw if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          items: [{ productId: 'prod-1', quantity: 1, price: 10 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if insufficient stock', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...mockProduct, stock: 1 });

      await expect(
        service.create('user-1', {
          items: [{ productId: 'prod-1', quantity: 5, price: 49.99 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a pending order and restore stock', async () => {
      const pendingOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING,
        orderItems: [
          {
            id: 'oi-1',
            productId: 'prod-1',
            orderId: 'order-1',
            quantity: 2,
            price: new Prisma.Decimal(49.99),
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct,
          },
        ],
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'hash',
          role: 'USER' as any,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prisma.order.findFirst.mockResolvedValue(pendingOrder);
      prisma.order.update.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CANCELLED,
      });
      prisma.product.update.mockResolvedValue(mockProduct);

      const result = await service.cancel('order-1', 'user-1');
      expect(result.data.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw if order is not PENDING', async () => {
      const shippedOrder = {
        ...mockOrder,
        status: OrderStatus.SHIPPED,
        orderItems: [
          {
            id: 'oi-1',
            productId: 'prod-1',
            orderId: 'order-1',
            quantity: 2,
            price: new Prisma.Decimal(49.99),
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct,
          },
        ],
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'hash',
          role: 'USER' as any,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prisma.order.findFirst.mockResolvedValue(shippedOrder);

      await expect(service.cancel('order-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
