// Jwt auth guard to protect routes that require authentication
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    // For example, you can check for specific roles or permissions
    return super.canActivate(context);
  }
}
