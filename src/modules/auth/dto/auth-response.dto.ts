import { Role } from '@prisma/client';
import { ApiProperty } from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';

// DTO for auth response
export class AuthResponseDto {
  @ApiProperty({
    description: 'The access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'The refresh token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'The user information',
    example: {
      id: 'user-id',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
    },
  })
  user!: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  };
}
