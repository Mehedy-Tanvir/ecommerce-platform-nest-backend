import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'The new quantity for the cart item',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;
}
