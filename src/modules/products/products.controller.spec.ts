import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<ProductsService>;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: 99.99,
    stock: 10,
    sku: 'TEST-001',
    imageUrl: null,
    isActive: true,
    category: 'Electronics',
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateProductStock: jest.fn(),
      deleteProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get(ProductsService);
  });

  describe('createProduct', () => {
    it('should call service.create', async () => {
      productsService.create.mockResolvedValue(mockProduct);

      const result = await controller.createProduct({
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        sku: 'TEST-001',
        categoryId: 'cat-1',
      });
      expect(result.sku).toBe('TEST-001');
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const paginatedResult = {
        data: [mockProduct],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      productsService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      productsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('prod-1');
      expect(result.id).toBe('prod-1');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      productsService.update.mockResolvedValue(mockProduct);

      const result = await controller.update('prod-1', { name: 'Updated' });
      expect(productsService.update).toHaveBeenCalledWith('prod-1', {
        name: 'Updated',
      });
    });
  });

  describe('updateProductStock', () => {
    it('should call service.updateProductStock', async () => {
      productsService.updateProductStock.mockResolvedValue({
        ...mockProduct,
        stock: 20,
      });

      const result = await controller.updateProductStock('prod-1', 10);
      expect(result.stock).toBe(20);
    });
  });

  describe('deleteProduct', () => {
    it('should call service.deleteProduct', async () => {
      productsService.deleteProduct.mockResolvedValue({
        message: 'Product deleted successfully.',
      });

      const result = await controller.deleteProduct('prod-1');
      expect(result.message).toBe('Product deleted successfully.');
    });
  });
});
