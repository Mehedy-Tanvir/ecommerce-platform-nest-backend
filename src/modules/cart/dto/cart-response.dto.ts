import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty({ description: 'The unique ID of the cart item' })
  id!: string;

  @ApiProperty({ description: 'The ID of the product' })
  productId!: string;

  @ApiProperty({ description: 'The name of the product' })
  productName!: string;

  @ApiProperty({ description: 'The unit price of the product', example: 19.99 })
  price!: number;

  @ApiProperty({ description: 'The quantity of the product in the cart' })
  quantity!: number;

  @ApiProperty({
    description: 'The subtotal for this item (price * quantity)',
    example: 39.98,
  })
  subtotal!: number;
}

export class CartResponseDto {
  @ApiProperty({ description: 'The unique ID of the cart' })
  id!: string;

  @ApiProperty({ description: 'The ID of the user who owns the cart' })
  userId!: string;

  @ApiProperty({
    type: [CartItemResponseDto],
    description: 'The items in the cart',
  })
  items!: CartItemResponseDto[];

  @ApiProperty({
    description: 'The total amount for all cart items',
    example: 39.98,
  })
  total!: number;

  @ApiProperty({ description: 'The creation timestamp of the cart' })
  createdAt!: Date;

  @ApiProperty({ description: 'The last update timestamp of the cart' })
  updatedAt!: Date;
}
