import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

// Dto for changing user password
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'currentPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'newPassword123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword!: string;
}
