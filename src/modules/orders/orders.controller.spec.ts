import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  const mockOrderResponse = {
    success: true,
    message: 'Order created successfully',
    data: {
      id: 'order-1',
      userId: 'user-1',
      status: 'PENDING',
      total: 99.98,
      shippingAddress: '123 Main St',
      items: [
        {
          id: 'oi-1',
          productId: 'prod-1',
          productName: 'Test Product',
          quantity: 2,
          price: 49.99,
          subtotal: 99.98,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      userEmail: 'test@example.com',
      userName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAllForAdmin: jest.fn(),
      findAllForUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  describe('create', () => {
    it('should call service.create with userId and dto', async () => {
      ordersService.create.mockResolvedValue(mockOrderResponse);

      const result = await controller.create(
        { items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }] },
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(ordersService.create).toHaveBeenCalledWith('user-1', {
        items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }],
      });
    });
  });

  describe('cancel', () => {
    it('should call service.cancel with id and userId', async () => {
      ordersService.cancel.mockResolvedValue(mockOrderResponse);

      const result = await controller.cancel('order-1', 'user-1');
      expect(ordersService.cancel).toHaveBeenCalledWith('order-1', 'user-1');
    });
  });
});
