// DTO for creating a product

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
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
}
