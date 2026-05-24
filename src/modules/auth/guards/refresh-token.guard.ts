import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// guard for refresh token
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
