import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AuthMiddleware } from './auth.middleware';
import { ValidateTokenUseCase } from '../../application/use-cases/validate-token/validate-token.use-case';
import { User } from '../../domain/entities/user.entity';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../domain/errors/auth.errors';
import { Request, Response, NextFunction } from 'express';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let validateTokenUseCase: jest.Mocked<ValidateTokenUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    validateTokenUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: ValidateTokenUseCase,
          useValue: validateTokenUseCase,
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('use', () => {
    it('should pass through when no authorization header is present', async () => {
      mockRequest.headers = {};

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(validateTokenUseCase.execute).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should validate token and attach user to request', async () => {
      const token = 'Bearer valid.jwt.token';
      mockRequest.headers = { authorization: token };
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      validateTokenUseCase.execute.mockResolvedValue(user);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: 'valid.jwt.token',
      });
      expect(mockRequest.user).toBe(user);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = { authorization: token };
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      validateTokenUseCase.execute.mockResolvedValue(user);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: 'valid.jwt.token',
      });
      expect(mockRequest.user).toBe(user);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass through silently when token validation fails', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token' };

      validateTokenUseCase.execute.mockRejectedValue(
        new InvalidTokenError('Invalid token'),
      );

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(validateTokenUseCase.execute).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass through silently when token is expired', async () => {
      mockRequest.headers = { authorization: 'Bearer expired.token' };

      validateTokenUseCase.execute.mockRejectedValue(
        new TokenExpiredError('Token expired'),
      );

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(validateTokenUseCase.execute).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass through silently on generic errors', async () => {
      mockRequest.headers = { authorization: 'Bearer some.token' };

      validateTokenUseCase.execute.mockRejectedValue(
        new Error('Network error'),
      );

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(validateTokenUseCase.execute).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
