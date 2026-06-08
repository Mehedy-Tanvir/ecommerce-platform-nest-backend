// DTO for category response
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the category',
  })
  id!: string;

  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the category',
  })
  name!: string;

  @ApiProperty({
    example: 'Electronics category for storing electronic products',
    description: 'The description of the category',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 'electronics',
    description: 'The slug of the category',
    nullable: true,
  })
  slug!: string | null;

  @ApiProperty({
    example: 'https://example.com/category-image.jpg',
    description: 'The image URL of the category',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is active',
  })
  isActive!: boolean;

  @ApiProperty({
    example: 42,
    description: 'The number of products in this category',
  })
  productCount!: number;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'The date and time when the category was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'The date and time when the category was last updated',
  })
  updatedAt!: Date;
}
