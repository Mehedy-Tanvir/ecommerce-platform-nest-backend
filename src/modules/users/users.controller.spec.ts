import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      changePassword: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getProfile', () => {
    it('should call findOne with user id from request', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getProfile({
        user: { id: 'user-1' },
      } as any);
      expect(result.email).toBe('test@example.com');
      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      usersService.findAll.mockResolvedValue([mockUser]);

      const result = await controller.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call findOne with id param', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-1');
      expect(usersService.findOne).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateProfile', () => {
    it('should call update with user id and dto', async () => {
      usersService.update.mockResolvedValue(mockUser);

      const result = await controller.updateProfile('user-1', {
        email: 'new@example.com',
      });
      expect(usersService.update).toHaveBeenCalledWith('user-1', {
        email: 'new@example.com',
      });
    });
  });

  describe('changePassword', () => {
    it('should call changePassword with user id and dto', async () => {
      usersService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const result = await controller.changePassword('user-1', {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456!',
      });
      expect(result.message).toBe('Password changed successfully');
    });
  });

  describe('deleteAccount', () => {
    it('should call remove with user id', async () => {
      usersService.remove.mockResolvedValue({
        message: 'User account deleted successfully',
      });

      const result = await controller.deleteAccount('user-1');
      expect(usersService.remove).toHaveBeenCalledWith('user-1');
    });
  });

  describe('remove', () => {
    it('should call remove with id param', async () => {
      usersService.remove.mockResolvedValue({
        message: 'User account deleted successfully',
      });

      const result = await controller.remove('user-1');
      expect(usersService.remove).toHaveBeenCalledWith('user-1');
    });
  });
});
