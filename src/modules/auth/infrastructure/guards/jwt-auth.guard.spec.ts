import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ValidateTokenUseCase } from '../../application/use-cases/validate-token/validate-token.use-case';
import { User } from '../../domain/entities/user.entity';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../domain/errors/auth.errors';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let validateTokenUseCase: jest.Mocked<ValidateTokenUseCase>;
  let reflector: jest.Mocked<Reflector>;

  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  const mockExecutionContext = (request: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({}) as any,
      switchToWs: () => ({}) as any,
      getType: () => 'http' as const,
    } as ExecutionContext;
  };

  beforeEach(async () => {
    validateTokenUseCase = {
      execute: jest.fn(),
    } as any;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: ValidateTokenUseCase,
          useValue: validateTokenUseCase,
        },
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      const context = mockExecutionContext({ headers: {} });
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockHandler,
        mockClass,
      ]);
      expect(validateTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('should validate token and attach user to request', async () => {
      const token = 'Bearer valid.jwt.token';
      const request = { headers: { authorization: token } };
      const context = mockExecutionContext(request);
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      reflector.getAllAndOverride.mockReturnValue(false);
      validateTokenUseCase.execute.mockResolvedValue(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect((request as any).user).toBe(user);
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: 'valid.jwt.token',
      });
    });

    it('should handle token without Bearer prefix', async () => {
      const token = 'valid.jwt.token';
      const request = { headers: { authorization: token } };
      const context = mockExecutionContext(request);
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      reflector.getAllAndOverride.mockReturnValue(false);
      validateTokenUseCase.execute.mockResolvedValue(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: 'valid.jwt.token',
      });
    });

    it('should throw UnauthorizedException when no authorization header', async () => {
      const request = { headers: {} };
      const context = mockExecutionContext(request);

      reflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing authorization header',
      );
    });

    it('should throw UnauthorizedException when authorization header is empty', async () => {
      const request = { headers: { authorization: '' } };
      const context = mockExecutionContext(request);

      reflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing authorization header',
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const request = { headers: { authorization: 'Bearer invalid.token' } };
      const context = mockExecutionContext(request);

      reflector.getAllAndOverride.mockReturnValue(false);
      validateTokenUseCase.execute.mockRejectedValue(
        new InvalidTokenError('Token is invalid'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const request = { headers: { authorization: 'Bearer expired.token' } };
      const context = mockExecutionContext(request);

      reflector.getAllAndOverride.mockReturnValue(false);
      validateTokenUseCase.execute.mockRejectedValue(
        new TokenExpiredError('Token expired'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Token expired');
    });

    it('should throw UnauthorizedException for generic errors', async () => {
      const request = { headers: { authorization: 'Bearer some.token' } };
      const context = mockExecutionContext(request);

      reflector.getAllAndOverride.mockReturnValue(false);
      validateTokenUseCase.execute.mockRejectedValue(
        new Error('Network error'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication failed',
      );
    });
  });
});
