/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

// jwt strategy for auth requests
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ?? 'default_secret_key_2026',
    });
  }

  //   Validate JWT payload
  async validate(payload: { sub: string; email: string; role: string }) {
    this.logger.debug(
      `Validating JWT for sub=${payload.sub} email=${payload.email} role=${payload.role}`,
    );
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });
    if (!user) {
      this.logger.warn(
        `JWT validation failed: user ${payload.sub} not found in DB`,
      );
      throw new UnauthorizedException('Invalid token');
    }
    this.logger.debug(
      `JWT validated successfully for user ${user.id} role=${user.role}`,
    );
    return user;
  }
}
