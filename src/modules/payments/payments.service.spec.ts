import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';
import { PaymentStatus } from '@prisma/client';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
        status: 'requires_payment_method',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      }),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockPayment = {
    id: 'pay-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: { toNumber: () => 99.99 } as any,
    currency: 'usd',
    status: PaymentStatus.PENDING,
    paymentMethod: 'STRIPE',
    transactionId: 'pi_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;

    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
        totalAmount: 99.99,
      } as any);
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.createPaymentIntent('user-1', {
        orderId: 'order-1',
        amount: 99.99,
      });

      expect(result.success).toBe(true);
      expect(result.data.clientSecret).toContain('secret');
    });

    it('should throw if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('user-1', {
          orderId: 'bad-order',
          amount: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if payment already completed', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
      } as any);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      await expect(
        service.createPaymentIntent('user-1', {
          orderId: 'order-1',
          amount: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm a payment', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.$transaction.mockImplementation(async (args: any) => {
        if (Array.isArray(args)) {
          return Promise.all(args);
        }
        return args;
      });
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });
      prisma.order.update.mockResolvedValue({} as any);
      prisma.order.findFirst.mockResolvedValue({ cartId: 'cart-1' } as any);
      prisma.cart.update.mockResolvedValue({} as any);

      const result = await service.confirmPayment('user-1', {
        paymentIntentId: 'pi_test_123',
        orderId: 'order-1',
      });

      expect(result.success).toBe(true);
    });

    it('should throw if payment not found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.confirmPayment('user-1', {
          paymentIntentId: 'pi_test_123',
          orderId: 'order-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
