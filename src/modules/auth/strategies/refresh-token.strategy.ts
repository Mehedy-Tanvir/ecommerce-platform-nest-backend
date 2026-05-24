import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
// refresh toke strategy
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  //   validate refresh token
  async validate(
    req: Request,
    payload: { sub: string; email: string; role: string },
  ) {
    console.log('RefreshTokenStrategy.validate called');
    console.log('payload', {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No Authorization header found in request');
      throw new UnauthorizedException('No Authorization header provided');
    }
    const refreshToken = authHeader.replace('Bearer', '').trim();
    if (!refreshToken) {
      console.log('No refresh token found in Authorization header');
      throw new UnauthorizedException('No refresh token provided');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, refreshToken: true },
    });
    if (!user || !user.refreshToken) {
      console.log('User not found or no refresh token stored for user');
      throw new UnauthorizedException('Invalid refresh token');
    }
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      console.log('Refresh token does not match stored token');
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
