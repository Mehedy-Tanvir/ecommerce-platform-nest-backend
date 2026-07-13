import { Test, TestingModule } from '@nestjs/testing';
import { TRPCError } from '@trpc/server';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesRouter } from '../categories.router';
import { CategoryService } from 'src/modules/category/category.service';
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

describe('CategoriesRouter', () => {
  let router: CategoriesRouter;
  let categoryService: jest.Mocked<CategoryService>;
  let adapter: ReturnType<typeof createMockAdapter>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic items',
    imageUrl: null,
    isActive: true,
    productCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    adapter = createMockAdapter();

    const mockService = {
      createCategory: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneBySlug: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesRouter,
        { provide: CategoryService, useValue: mockService },
        { provide: TRPCAdapter, useValue: adapter },
      ],
    }).compile();

    router = module.get<CategoriesRouter>(CategoriesRouter);
    categoryService = module.get(CategoryService);
  });

  describe('procedure registration', () => {
    it('should register all 6 procedures with correct auth guards', () => {
      const routes = router.router;
      expect(routes).toHaveProperty('getAll');
      expect(routes).toHaveProperty('getById');
      expect(routes).toHaveProperty('getBySlug');
      expect(routes).toHaveProperty('create');
      expect(routes).toHaveProperty('update');
      expect(routes).toHaveProperty('delete');
      expect(adapter.procedure.query).toHaveBeenCalledTimes(3);
      expect(adapter.adminProcedure.mutation).toHaveBeenCalledTimes(3);
      expect(adapter.protectedProcedure.query).not.toHaveBeenCalled();
      expect(adapter.protectedProcedure.mutation).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return paginated categories with search', async () => {
      const paginatedResult = {
        data: [mockCategory],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      categoryService.findAll.mockResolvedValue(paginatedResult);

      const result = await router.router.getAll.handler({
        input: { page: 1, limit: 10, search: 'elec' },
      });

      expect(categoryService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'elec',
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should return empty list when no matches', async () => {
      const emptyResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      categoryService.findAll.mockResolvedValue(emptyResult);

      const result = await router.router.getAll.handler({
        input: { page: 1, limit: 10 },
      });

      expect(result.data).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return category by id', async () => {
      categoryService.findOne.mockResolvedValue(mockCategory);

      const result = await router.router.getById.handler({ input: 'cat-1' });

      expect(categoryService.findOne).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw TRPCError NOT_FOUND', async () => {
      categoryService.findOne.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(
        router.router.getById.handler({ input: 'invalid' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('getBySlug', () => {
    it('should return category by slug', async () => {
      categoryService.findOneBySlug.mockResolvedValue(mockCategory);

      const result = await router.router.getBySlug.handler({
        input: 'electronics',
      });

      expect(categoryService.findOneBySlug).toHaveBeenCalledWith('electronics');
      expect(result).toEqual(mockCategory);
    });

    it('should throw TRPCError NOT_FOUND for invalid slug', async () => {
      categoryService.findOneBySlug.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(
        router.router.getBySlug.handler({ input: 'invalid-slug' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Category',
      slug: 'new-category',
      description: 'A new category',
    };

    it('should call categoryService.createCategory with input', async () => {
      categoryService.createCategory.mockResolvedValue({
        ...mockCategory,
        ...createDto,
      });

      const result = await router.router.create.handler({ input: createDto });

      expect(categoryService.createCategory).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe('New Category');
    });

    it('should throw TRPCError CONFLICT on duplicate slug', async () => {
      categoryService.createCategory.mockRejectedValue(
        new ConflictException('Slug already exists'),
      );

      await expect(
        router.router.create.handler({ input: createDto }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('update', () => {
    const updateInput = {
      id: 'cat-1',
      data: { name: 'Updated Category' },
    };

    it('should call categoryService.updateCategory with id and data', async () => {
      categoryService.updateCategory.mockResolvedValue({
        ...mockCategory,
        name: 'Updated Category',
      });

      const result = await router.router.update.handler({
        input: updateInput,
      });

      expect(categoryService.updateCategory).toHaveBeenCalledWith('cat-1', {
        name: 'Updated Category',
      });
      expect(result.name).toBe('Updated Category');
    });

    it('should throw TRPCError NOT_FOUND', async () => {
      categoryService.updateCategory.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(
        router.router.update.handler({ input: updateInput }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('delete', () => {
    it('should call categoryService.deleteCategory', async () => {
      categoryService.deleteCategory.mockResolvedValue({
        message: 'Category has been successfully deleted.',
      });

      const result = await router.router.delete.handler({ input: 'cat-1' });

      expect(categoryService.deleteCategory).toHaveBeenCalledWith('cat-1');
      expect(result.message).toContain('successfully deleted');
    });

    it('should throw TRPCError BAD_REQUEST if category has products', async () => {
      categoryService.deleteCategory.mockRejectedValue(
        new BadRequestException('Category has products'),
      );

      await expect(
        router.router.delete.handler({ input: 'cat-1' }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('should throw TRPCError NOT_FOUND', async () => {
      categoryService.deleteCategory.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(
        router.router.delete.handler({ input: 'invalid' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
