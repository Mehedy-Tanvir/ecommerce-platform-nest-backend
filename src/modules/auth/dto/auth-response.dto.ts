import { Role } from '@prisma/client';

// DTO for auth response
export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  };
}
