import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';
import { Prisma } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    description: null,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: new Prisma.Decimal(99.99),
    stock: 10,
    sku: 'TEST-001',
    imageUrl: null,
    isActive: true,
    categoryId: 'cat-1',
    category: mockCategory,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create({
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        sku: 'TEST-001',
        categoryId: 'cat-1',
      });

      expect(result.sku).toBe('TEST-001');
      expect(result.price).toBe(99.99);
    });

    it('should throw ConflictException if SKU exists', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.create({
          name: 'Duplicate',
          price: 10,
          stock: 1,
          sku: 'TEST-001',
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-1');
      expect(result.id).toBe('prod-1');
    });

    it('should throw NotFoundException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('prod-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProductStock', () => {
    it('should increment stock', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, stock: 15 });

      const result = await service.updateProductStock('prod-1', 5);
      expect(result.stock).toBe(15);
    });

    it('should decrement stock', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, stock: 7 });

      const result = await service.updateProductStock('prod-1', -3);
      expect(result.stock).toBe(7);
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.updateProductStock('prod-1', -20)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product with no orders', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        orderItems: [],
        cartItems: [],
      });
      prisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.deleteProduct('prod-1');
      expect(result.message).toBe('Product deleted successfully.');
    });

    it('should throw if product has order items', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        orderItems: [{ id: 'oi-1' }],
        cartItems: [],
      } as any);

      await expect(service.deleteProduct('prod-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
