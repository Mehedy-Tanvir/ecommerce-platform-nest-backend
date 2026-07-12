import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

describe('CategoryController', () => {
  let controller: CategoryController;
  let categoryService: jest.Mocked<CategoryService>;

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
    const mockService = {
      createCategory: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneBySlug: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    categoryService = module.get(CategoryService);
  });

  describe('createCategory', () => {
    it('should call service.createCategory', async () => {
      categoryService.createCategory.mockResolvedValue(mockCategory);

      const result = await controller.createCategory({ name: 'Electronics' });
      expect(result.name).toBe('Electronics');
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const paginatedResult = {
        data: [mockCategory],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      categoryService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      categoryService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne('cat-1');
      expect(result.name).toBe('Electronics');
    });
  });

  describe('findOneBySlug', () => {
    it('should call service.findOneBySlug', async () => {
      categoryService.findOneBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findOneBySlug('electronics');
      expect(result.name).toBe('Electronics');
    });
  });

  describe('deleteCategory', () => {
    it('should call service.deleteCategory', async () => {
      categoryService.deleteCategory.mockResolvedValue({
        message: 'Category has been successfully deleted.',
      });

      const result = await controller.deleteCategory('cat-1');
      expect(result.message).toContain('successfully deleted');
    });
  });
});
