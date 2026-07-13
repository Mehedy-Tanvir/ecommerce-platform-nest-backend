import { Test, TestingModule } from '@nestjs/testing';
import { TRPCError } from '@trpc/server';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductsRouter } from '../products.router';
import { ProductsService } from 'src/modules/products/products.service';
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

describe('ProductsRouter', () => {
  let router: ProductsRouter;
  let productsService: jest.Mocked<ProductsService>;
  let adapter: ReturnType<typeof createMockAdapter>;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: 99.99,
    stock: 10,
    sku: 'TEST-001',
    imageUrl: null,
    isActive: true,
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Electronics' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    adapter = createMockAdapter();

    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateProductStock: jest.fn(),
      deleteProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsRouter,
        { provide: ProductsService, useValue: mockService },
        { provide: TRPCAdapter, useValue: adapter },
      ],
    }).compile();

    router = module.get<ProductsRouter>(ProductsRouter);
    productsService = module.get(ProductsService);
  });

  describe('procedure registration', () => {
    it('should register all 6 procedures with correct auth guards', () => {
      const routes = router.router;
      expect(routes).toHaveProperty('getAll');
      expect(routes).toHaveProperty('getById');
      expect(routes).toHaveProperty('create');
      expect(routes).toHaveProperty('update');
      expect(routes).toHaveProperty('updateStock');
      expect(routes).toHaveProperty('delete');
      expect(adapter.procedure.query).toHaveBeenCalledTimes(2);
      expect(adapter.adminProcedure.mutation).toHaveBeenCalledTimes(4);
      expect(adapter.protectedProcedure.query).not.toHaveBeenCalled();
      expect(adapter.protectedProcedure.mutation).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return paginated products', async () => {
      const paginatedResult = {
        data: [mockProduct],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      productsService.findAll.mockResolvedValue(paginatedResult);

      const result = await router.router.getAll.handler({
        input: { page: 1, limit: 10 },
      });

      expect(productsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should handle empty result', async () => {
      const emptyResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      productsService.findAll.mockResolvedValue(emptyResult);

      const result = await router.router.getAll.handler({
        input: { page: 1, limit: 10 },
      });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return single product', async () => {
      productsService.findOne.mockResolvedValue(mockProduct);

      const result = await router.router.getById.handler({ input: 'prod-1' });

      expect(productsService.findOne).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw TRPCError NOT_FOUND for invalid id', async () => {
      productsService.findOne.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        router.router.getById.handler({ input: 'invalid' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should throw TRPCError on unexpected error', async () => {
      productsService.findOne.mockRejectedValue(new Error('DB error'));

      await expect(
        router.router.getById.handler({ input: 'prod-1' }),
      ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Product',
      description: 'Description',
      price: 29.99,
      stock: 5,
      sku: 'NEW-001',
      categoryId: 'cat-1',
    };

    it('should call productsService.create with input', async () => {
      productsService.create.mockResolvedValue({
        ...mockProduct,
        ...createDto,
      });

      const result = await router.router.create.handler({ input: createDto });

      expect(productsService.create).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe('New Product');
    });

    it('should throw TRPCError CONFLICT on duplicate SKU', async () => {
      productsService.create.mockRejectedValue(
        new ConflictException('SKU already exists'),
      );

      await expect(
        router.router.create.handler({ input: createDto }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('should throw TRPCError BAD_REQUEST on invalid data', async () => {
      productsService.create.mockRejectedValue(
        new BadRequestException('Invalid data'),
      );

      await expect(
        router.router.create.handler({ input: createDto }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });

  describe('update', () => {
    const updateInput = {
      id: 'prod-1',
      data: { name: 'Updated Name' },
    };

    it('should call productsService.update with id and data', async () => {
      productsService.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Name',
      });

      const result = await router.router.update.handler({
        input: updateInput,
      });

      expect(productsService.update).toHaveBeenCalledWith('prod-1', {
        name: 'Updated Name',
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw TRPCError NOT_FOUND', async () => {
      productsService.update.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        router.router.update.handler({ input: updateInput }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('updateStock', () => {
    it('should call productsService.updateProductStock', async () => {
      productsService.updateProductStock.mockResolvedValue({
        ...mockProduct,
        stock: 15,
      });

      const result = await router.router.updateStock.handler({
        input: { id: 'prod-1', quantity: 5 },
      });

      expect(productsService.updateProductStock).toHaveBeenCalledWith(
        'prod-1',
        5,
      );
      expect(result.stock).toBe(15);
    });

    it('should throw TRPCError BAD_REQUEST on insufficient stock', async () => {
      productsService.updateProductStock.mockRejectedValue(
        new BadRequestException('Insufficient stock'),
      );

      await expect(
        router.router.updateStock.handler({
          input: { id: 'prod-1', quantity: -20 },
        }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });

  describe('delete', () => {
    it('should call productsService.deleteProduct', async () => {
      productsService.deleteProduct.mockResolvedValue({
        message: 'Product deleted successfully.',
      });

      const result = await router.router.delete.handler({ input: 'prod-1' });

      expect(productsService.deleteProduct).toHaveBeenCalledWith('prod-1');
      expect(result.message).toBe('Product deleted successfully.');
    });

    it('should throw TRPCError NOT_FOUND for non-existent product', async () => {
      productsService.deleteProduct.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        router.router.delete.handler({ input: 'invalid' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should throw TRPCError BAD_REQUEST if product has orders', async () => {
      productsService.deleteProduct.mockRejectedValue(
        new BadRequestException('Product has existing orders'),
      );

      await expect(
        router.router.delete.handler({ input: 'prod-1' }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });
});
