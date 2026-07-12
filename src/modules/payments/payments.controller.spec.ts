import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: jest.Mocked<PaymentsService>;

  const mockPaymentIntentResponse = {
    success: true,
    data: {
      clientSecret: 'pi_test_123_secret_abc',
      paymentId: 'pay-1',
    },
    message: 'Payment intent created successfully',
  };

  const mockConfirmResponse = {
    success: true,
    data: {
      id: 'pay-1',
      orderId: 'order-1',
      userId: 'user-1',
      amount: 99.99,
      currency: 'usd',
      status: 'COMPLETED',
      paymentMethod: 'STRIPE',
      transactionId: 'pi_test_123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    message: 'Payment confirmed',
  };

  beforeEach(async () => {
    const mockService = {
      createPaymentIntent: jest.fn(),
      confirmPayment: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get(PaymentsService);
  });

  describe('createPaymentIntent', () => {
    it('should call service.createPaymentIntent', async () => {
      paymentsService.createPaymentIntent.mockResolvedValue(
        mockPaymentIntentResponse,
      );

      const result = await controller.createPaymentIntent(
        { orderId: 'order-1', amount: 99.99 },
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(result.data.clientSecret).toContain('secret');
    });
  });

  describe('confirmPayment', () => {
    it('should call service.confirmPayment', async () => {
      paymentsService.confirmPayment.mockResolvedValue(mockConfirmResponse);

      const result = await controller.confirmPayment(
        { paymentIntentId: 'pi_test_123', orderId: 'order-1' },
        'user-1',
      );
      expect(result.success).toBe(true);
    });
  });
});
