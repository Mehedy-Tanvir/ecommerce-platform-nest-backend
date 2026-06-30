import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Category, Prisma } from '@prisma/client';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private prisma: PrismaService) {}

  //   create a new category
  async createCategory(createCategoryDto: CreateCategoryDto) {
    const { name, slug, ...rest } = createCategoryDto;

    const categorySlug =
      slug ??
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (existingCategory) {
      this.logger.warn(
        `[createCategory] Slug conflict: "${categorySlug}" already exists.`,
      );
      throw new ConflictException(
        `Category with slug "${categorySlug}" already exists.`,
      );
    }

    // Include _count so productCount is always read from DB (not hardcoded to 0)
    const category = await this.prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        ...rest,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return this.formatCategory(category, category._count.products);
  }

  private formatCategory(
    category: Category,
    productCount: number,
  ): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount,
      imageUrl: category.imageUrl,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  // Get all categories
  async findAll(queryDto: QueryCategoryDto): Promise<{
    data: CategoryResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { isActive, search, page = 1, limit = 10 } = queryDto;
    const where: Prisma.CategoryWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.category.count({ where });
    const categories = await this.prisma.category.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const data = categories.map((category) => {
      const productCount = category._count.products;
      return this.formatCategory(category, productCount);
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get a category by ID
  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    const productCount = Number(category._count.products);
    return this.formatCategory(category, productCount);
  }

  // Get a category by slug
  async findOneBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    const productCount = Number(category._count.products);
    return this.formatCategory(category, productCount);
  }

  // update a category
  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Step 1: Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      this.logger.warn(`[updateCategory] Category not found for id: ${id}`);
      throw new NotFoundException('Category not found.');
    }

    // Step 2: Check slug uniqueness if slug is being changed
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });
      if (existingCategory) {
        this.logger.warn(
          `[updateCategory] Slug conflict: "${updateCategoryDto.slug}" is already used by category id: ${existingCategory.id}`,
        );
        throw new ConflictException(
          `Category with this slug ${updateCategoryDto.slug} already exists.`,
        );
      }
    }

    // Step 3: Strip unknown fields (e.g. id, productCount) that are not
    // part of the Prisma Category update schema before saving.
    const { name, slug, description, imageUrl, isActive } = updateCategoryDto;
    const sanitizedData: Prisma.CategoryUpdateInput = {};
    if (name !== undefined) sanitizedData.name = name;
    if (slug !== undefined) sanitizedData.slug = slug;
    if (description !== undefined) sanitizedData.description = description;
    if (imageUrl !== undefined) sanitizedData.imageUrl = imageUrl;
    if (isActive !== undefined) sanitizedData.isActive = isActive;

    // Step 4: Perform the update
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: sanitizedData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return this.formatCategory(
      updatedCategory,
      Number(updatedCategory._count.products),
    );
  }

  // delete a category
  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    if (category._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category._count.products} associated products. Remove or reassign these products before deleting the category.`,
      );
    }
    await this.prisma.category.delete({
      where: { id },
    });
    return { message: 'Category has been successfully deleted.' };
  }
}
