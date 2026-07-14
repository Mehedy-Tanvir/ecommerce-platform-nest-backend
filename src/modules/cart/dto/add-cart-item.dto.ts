import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'The ID of the product to add to the cart',
    example: 'c1f1a1b2-0000-4000-8000-000000000001',
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    description: 'The quantity of the product to add',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity?: number = 1;
}
