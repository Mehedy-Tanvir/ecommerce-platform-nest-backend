// DTO for creating a product

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'iPhone 13',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'The description of the product',
    example: 'Latest iPhone model with advanced features',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'The price of the product',
    example: 999.99,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price!: number;

  @ApiProperty({
    description: 'The stock quantity of the product',
    example: 100,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock!: number;

  @ApiProperty({
    description: 'The SKU of the product',
    example: 'iPhone13',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku!: string;

  @ApiProperty({
    description: 'The image URL of the product',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'The category of the product',
    example: 'Electronics',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({
    description: 'Indicates if the product is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}
