import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { Category, Prisma } from '@prisma/client';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoryService {
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
      throw new Error('Category with this slug already exists.');
    }
    const category = await this.prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        ...rest,
      },
    });
    return this.formatCategory(category, 0);
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
}
