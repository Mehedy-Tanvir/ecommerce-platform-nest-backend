// DTO for product response

import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: '46545646-4665643df-5346gfdfg',
  })
  id!: string;

  @ApiProperty({
    description: 'Product Name',
    example: 'Wireless Headphone',
  })
  name!: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High quality wireless headphones',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Product price',
    example: 99.99,
  })
  price!: number;

  @ApiProperty({
    description: 'Product stock',
    example: 50,
  })
  stock!: number;

  @ApiProperty({
    description: 'Stock keeping unit',
    example: 'WH-001',
  })
  sku!: string;

  @ApiProperty({
    description: 'Product image url',
    example: 'https://example.com/image.jpg',
  })
  imageUrl?: string | null;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
  })
  category!: string | null;

  @ApiProperty({
    description: 'Product availability status',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  updatedAt!: Date;
}
