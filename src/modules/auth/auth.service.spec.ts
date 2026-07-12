import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as any,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();
    const mockJwt = {
      signAsync: jest.fn(),
    } as any;
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        return null;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;
    jwtService = mockJwt;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('mock-token');

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login and return tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('mock-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPass123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refreshTokens('user-1');
      expect(result.accessToken).toBe('new-token');
    });

    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await service.logout('user-1');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { refreshToken: null },
        }),
      );
    });
  });
});
