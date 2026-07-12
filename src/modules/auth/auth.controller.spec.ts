import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    accessToken: 'token-123',
    refreshToken: 'refresh-456',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER' as any,
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should call service.register and return result', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.accessToken).toBe('token-123');
      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
      });
    });
  });

  describe('login', () => {
    it('should call service.login and return tokens', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.accessToken).toBe('token-123');
    });
  });

  describe('refresh', () => {
    it('should call refreshTokens with user ID', async () => {
      authService.refreshTokens.mockResolvedValue(mockAuthResponse);

      await controller.refresh('user-1');
      expect(authService.refreshTokens).toHaveBeenCalledWith('user-1');
    });
  });

  describe('logout', () => {
    it('should call logout with user ID', async () => {
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout('user-1');
      expect(result.message).toBe('Successfully logged out');
    });
  });
});
