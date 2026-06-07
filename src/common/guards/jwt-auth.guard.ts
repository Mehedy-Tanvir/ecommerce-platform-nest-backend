// Jwt auth guard to protect routes that require authentication
import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    // For example, you can check for specific roles or permissions
    return super.canActivate(context);
  }

  // Override handleRequest to log exact JWT failure reasons
  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const reason =
        info?.name === 'TokenExpiredError'
          ? `Token expired at ${info.expiredAt}`
          : info?.message ?? err?.message ?? 'Unknown reason';
      this.logger.warn(`JWT authentication failed: ${reason}`);
      throw err ?? new UnauthorizedException(`Authentication failed: ${reason}`);
    }
    return user;
  }
}
