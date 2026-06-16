import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { Category, Prisma, Product } from '@prisma/client';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(private prisma: PrismaService) {}

  //   create product
  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });
    if (existingSku) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exists.`,
      );
    }

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        price: new Prisma.Decimal(createProductDto.price),
      },
      include: {
        category: true,
      },
    });

    return this.formatProduct(product);
  }

  private formatProduct(
    product: Product & { category: Category },
  ): ProductResponseDto {
    return {
      ...product,
      category: product.category.name,
      price: Number(product.price),
    };
  }

  //   get all products
  async findAll(queryDto: QueryProductDto): Promise<{
    data: ProductResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { category, isActive, search, page = 1, limit = 10 } = queryDto;

    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.categoryId = category;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const total = await this.prisma.product.count({ where });

    const products = await this.prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });

    return {
      data: products.map((product) => this.formatProduct(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  //   get product by id
  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.formatProduct(product);
  }

  // update a existing product
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Update called for product id: ${id}`);
    this.logger.debug(`Payload received: ${JSON.stringify(updateProductDto)}`);

    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!existingProduct) {
      throw new NotFoundException('Product not found!');
    }
    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const skuTaken = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });
      if (skuTaken) {
        throw new ConflictException(
          `Product with SKU ${updateProductDto.sku} already exists`,
        );
      }
    }

    // Strip out fields that are not part of the Prisma Product model
    // (e.g. 'category' string and 'id' sometimes sent from clients)
    const {
      category: _category,
      id: _id,
      ...cleanDto
    } = updateProductDto as UpdateProductDto & {
      id?: string;
      category?: string;
    };
    void _category;
    void _id;

    const updateData: Prisma.ProductUncheckedUpdateInput = { ...cleanDto };
    if (cleanDto.price !== undefined) {
      updateData.price = new Prisma.Decimal(cleanDto.price);
    }

    this.logger.debug(`Prisma update data: ${JSON.stringify(updateData)}`);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return this.formatProduct(updatedProduct);
  }

  // update product stock
  async updateProductStock(
    id: string,
    quantity: number,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException("Product doesn't exist");
    }
    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: {
        category: true,
      },
    });

    return this.formatProduct(updatedProduct);
  }

  // delete product by id
  async deleteProduct(id: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        cartItems: true,
      },
    });

    if (!product) {
      throw new NotFoundException("Product doesn't exist");
    }
    if (product.orderItems.length > 0) {
      throw new BadRequestException(
        'Can not delete product that is part of existing orders. Consider making it as inactive only',
      );
    }
    await this.prisma.product.delete({
      where: { id },
    });
    return { message: 'Product deleted successfully.' };
  }
}
