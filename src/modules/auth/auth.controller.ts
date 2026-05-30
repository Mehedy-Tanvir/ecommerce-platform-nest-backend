import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/gaurds/jwt-auth.guard';
import { LoginDto } from './dto/login-dto';
import { ApiOperation } from 'node_modules/@nestjs/swagger/dist/decorators/api-operation.decorator';
import { ApiResponse } from 'node_modules/@nestjs/swagger/dist/decorators/api-response.decorator';
import { ApiBearerAuth } from 'node_modules/@nestjs/swagger/dist/decorators/api-bearer.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //   register api
  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account.',
  })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully registered.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation failed or email already exists.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. An unexpected error occurred.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests. Please try again later.',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return await this.authService.register(registerDto);
  }

  // refresh access token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('JWT-refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'The access token has been successfully refreshed.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. The refresh token is invalid or expired.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. An unexpected error occurred.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests. Please try again later.',
  })
  async refresh(@GetUser('id') userId: string): Promise<AuthResponseDto> {
    return await this.authService.refreshTokens(userId);
  }

  // logout api
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logs out the user by invalidating the refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged out.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. The user is not authenticated.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests. Please try again later.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. An unexpected error occurred.',
  })
  async logout(@GetUser('id') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Successfully logged out' };
  }
  // login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticates the user and returns access and refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged in.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. The credentials are invalid.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests. Please try again later.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. An unexpected error occurred.',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }
}
