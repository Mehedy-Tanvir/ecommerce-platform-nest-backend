import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateProductDto } from './dto/update-product.dto';
import { CacheService } from '../cache/cache.service';
import { CacheInvalidate } from '../../common/decorators/cache-invalidate.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productService: ProductsService,
    private readonly cacheService: CacheService,
  ) {}

  //   create a new product
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @CacheInvalidate('products:*')
  @ApiOperation({ summary: 'Create a new product admin only' })
  @ApiBody({
    type: CreateProductDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Sku already exists.' })
  @ApiResponse({ status: 403, description: 'Forbidden admin role required' })
  createProduct(
    @Body() createProductDto: CreateProductDto,
    @GetUser('id') userId?: string,
  ): Promise<ProductResponseDto> {
    return this.productService.create(createProductDto, userId);
  }

  // Get all products
  @Get()
  @ApiOperation({
    summary: 'Get all products with optimal filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() queryDto: QueryProductDto): Promise<{
    data: ProductResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return await this.cacheService.getOrSet(
      `products:list:${JSON.stringify(queryDto)}`,
      60,
      () => this.productService.findAll(queryDto),
    );
  }

  // get product by id
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.cacheService.getOrSet(`products:${id}`, 120, () =>
      this.productService.findOne(id),
    );
  }

  // update a product
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @CacheInvalidate('products:*')
  @ApiOperation({
    summary: 'Update a product - Admin only',
  })
  @ApiBody({
    type: UpdateProductDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'SKU already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser('id') userId?: string,
  ): Promise<ProductResponseDto> {
    return await this.productService.update(id, updateProductDto, userId);
  }

  // update product stock

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @CacheInvalidate('products:*')
  @ApiOperation({
    summary: 'Update product stock - Admin only',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: {
          type: 'number',
          description:
            'Stock adjustment (positive to add, negative to subtract)',
          example: 10,
        },
      },
      required: ['quantity'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient stock',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async updateProductStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<ProductResponseDto> {
    return await this.productService.updateProductStock(id, quantity);
  }

  // Remove a product by ID
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @CacheInvalidate('products:*')
  @ApiOperation({
    summary: 'Delete product - Admin only',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Can not delete product in active orders',
  })
  async deleteProduct(
    @Param('id') id: string,
    @GetUser('id') userId?: string,
  ): Promise<{ message: string }> {
    return await this.productService.deleteProduct(id, userId);
  }
}
