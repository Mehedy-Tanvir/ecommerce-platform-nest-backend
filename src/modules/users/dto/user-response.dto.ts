import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: Role,
  })
  role!: Role;

  @ApiProperty({
    description: 'Timestamp when the user was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the user was last updated',
    example: '2023-01-02T00:00:00.000Z',
  })
  updatedAt!: Date;
}
