import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createMockPrisma } from 'src/common/test/test-utils';
import type { DeepMockProxy } from 'jest-mock-extended';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as any,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = mockPrisma as unknown as DeepMockProxy<PrismaService>;
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update user email successfully', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
      });

      const result = await service.update('user-1', {
        email: 'new@example.com',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('should throw ConflictException if email is taken', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        id: 'other-user',
      });

      await expect(
        service.update('user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', { email: 'new@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.changePassword('user-1', {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456!',
      });
      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw ConflictException if current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'WrongPass',
          newPassword: 'NewPass456!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove('user-1');
      expect(result.message).toBe('User account deleted successfully');
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
