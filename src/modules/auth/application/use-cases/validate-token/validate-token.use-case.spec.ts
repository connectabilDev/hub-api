import { Test, TestingModule } from '@nestjs/testing';
import { ValidateTokenUseCase } from './validate-token.use-case';
import { TokenValidationRepository } from '../../../domain/repositories/token-validation.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../../domain/errors/auth.errors';

describe('ValidateTokenUseCase', () => {
  let useCase: ValidateTokenUseCase;
  let mockRepository: jest.Mocked<TokenValidationRepository>;

  beforeEach(async () => {
    mockRepository = {
      validateToken: jest.fn(),
      getJwks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateTokenUseCase,
        {
          provide: 'TOKEN_VALIDATION_REPOSITORY',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ValidateTokenUseCase>(ValidateTokenUseCase);
  });

  describe('execute', () => {
    it('should validate token and return user', async () => {
      const token = 'valid.jwt.token';
      const expectedUser = new User({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
        roles: ['user'],
      });

      mockRepository.validateToken.mockResolvedValue(expectedUser);

      const result = await useCase.execute({ token });

      expect(result).toBe(expectedUser);
      expect(mockRepository.validateToken).toHaveBeenCalledWith(token);
    });

    it('should throw InvalidTokenError when token is invalid', async () => {
      const token = 'invalid.jwt.token';
      const error = new InvalidTokenError('Invalid token signature');

      mockRepository.validateToken.mockRejectedValue(error);

      await expect(useCase.execute({ token })).rejects.toThrow(
        InvalidTokenError,
      );
      expect(mockRepository.validateToken).toHaveBeenCalledWith(token);
    });

    it('should throw TokenExpiredError when token is expired', async () => {
      const token = 'expired.jwt.token';
      const error = new TokenExpiredError('Token expired at 2021-01-01');

      mockRepository.validateToken.mockRejectedValue(error);

      await expect(useCase.execute({ token })).rejects.toThrow(
        TokenExpiredError,
      );
      expect(mockRepository.validateToken).toHaveBeenCalledWith(token);
    });

    it('should propagate repository errors', async () => {
      const token = 'some.jwt.token';
      const error = new Error('Network error');

      mockRepository.validateToken.mockRejectedValue(error);

      await expect(useCase.execute({ token })).rejects.toThrow('Network error');
    });
  });
});
