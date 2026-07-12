import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic items',
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { products: 5 },
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;
  });

  describe('createCategory', () => {
    it('should create with auto-generated slug', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory({ name: 'Electronics' });
      expect(result.name).toBe('Electronics');
      expect(result.slug).toBe('electronics');
    });

    it('should throw on duplicate slug', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(
        service.createCategory({ name: 'Electronics' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      prisma.category.count.mockResolvedValue(1);
      prisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].productCount).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should find by id', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      const result = await service.findOne('cat-1');
      expect(result.name).toBe('Electronics');
    });
  });

  describe('findOneBySlug', () => {
    it('should find by slug', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      const result = await service.findOneBySlug('electronics');
      expect(result.name).toBe('Electronics');
    });
  });

  describe('deleteCategory', () => {
    it('should delete empty category', async () => {
      prisma.category.findUnique.mockResolvedValue({
        ...mockCategory,
        _count: { products: 0 },
      });
      prisma.category.delete.mockResolvedValue(mockCategory);

      const result = await service.deleteCategory('cat-1');
      expect(result.message).toContain('successfully deleted');
    });

    it('should throw if category has products', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.deleteCategory('cat-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
