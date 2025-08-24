import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogtoTokenValidationService } from './logto-token-validation.service';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../domain/errors/auth.errors';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
  errors: {
    JWTExpired: class extends Error {
      constructor(message: string) {
        super(message);
      }
    },
    JWTInvalid: class extends Error {
      constructor(message: string) {
        super(message);
      }
    },
  },
}));

import * as jose from 'jose';

describe('LogtoTokenValidationService', () => {
  let service: LogtoTokenValidationService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'LOGTO_DOMAIN':
            return 'https://logto.example.com';
          case 'LOGTO_API_RESOURCE_INDICATOR':
            return 'api-resource';
          default:
            return undefined;
        }
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogtoTokenValidationService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<LogtoTokenValidationService>(
      LogtoTokenValidationService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateToken', () => {
    const mockJwks = jest.fn();

    beforeEach(() => {
      (jose.createRemoteJWKSet as jest.Mock).mockReturnValue(mockJwks as any);
    });

    it('should validate token successfully and return user', async () => {
      const token = 'valid.jwt.token';
      const mockPayload = {
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
        user_id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        roles: ['user', 'admin'],
      };

      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'ES384' },
      } as any);

      const result = await service.validateToken(token);

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.picture).toBe('https://example.com/avatar.jpg');
      expect(result.roles).toEqual(['user', 'admin']);
      expect(result.sub).toBe('logto-sub-123');
      expect(result.iat).toBe(1640995200);
      expect(result.exp).toBe(1641081600);
      expect(result.aud).toBe('api-resource');
      expect(result.iss).toBe('https://logto.example.com/oidc');

      expect(jose.jwtVerify).toHaveBeenCalledWith(token, mockJwks, {
        issuer: 'https://logto.example.com/oidc',
        audience: 'api-resource',
        algorithms: ['ES384'],
      });
    });

    it('should use sub as id when user_id is not present', async () => {
      const token = 'valid.jwt.token';
      const mockPayload = {
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
        email: 'test@example.com',
      };

      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'ES384' },
      } as any);

      const result = await service.validateToken(token);

      expect(result.id).toBe('logto-sub-123');
    });

    it('should handle missing optional fields', async () => {
      const token = 'valid.jwt.token';
      const mockPayload = {
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
        email: 'test@example.com',
      };

      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'ES384' },
      } as any);

      const result = await service.validateToken(token);

      expect(result.name).toBeUndefined();
      expect(result.picture).toBeUndefined();
      expect(result.roles).toEqual([]);
    });

    it('should throw InvalidTokenError when JWT verification fails', async () => {
      const token = 'invalid.jwt.token';
      const jwtError = new Error('JWT verification failed');

      (jose.jwtVerify as jest.Mock).mockRejectedValue(jwtError);

      await expect(service.validateToken(token)).rejects.toThrow(
        InvalidTokenError,
      );
      await expect(service.validateToken(token)).rejects.toThrow(
        'Token validation failed',
      );
    });

    it('should throw TokenExpiredError when token is expired', async () => {
      const token = 'expired.jwt.token';
      const jwtError = new (jose.errors.JWTExpired as any)('Token expired');

      (jose.jwtVerify as jest.Mock).mockRejectedValue(jwtError);

      await expect(service.validateToken(token)).rejects.toThrow(
        TokenExpiredError,
      );
    });

    it('should throw InvalidTokenError for other JWT errors', async () => {
      const token = 'invalid.jwt.token';
      const jwtError = new jose.errors.JWTInvalid('Invalid JWT');

      (jose.jwtVerify as jest.Mock).mockRejectedValue(jwtError);

      await expect(service.validateToken(token)).rejects.toThrow(
        InvalidTokenError,
      );
    });
  });

  describe('getJwks', () => {
    it('should create and return JWKS', async () => {
      const mockJwks = { keys: [] };
      (jose.createRemoteJWKSet as jest.Mock).mockReturnValue(mockJwks as any);

      const result = await service.getJwks();

      expect(result).toBe(mockJwks);
      expect(jose.createRemoteJWKSet).toHaveBeenCalledWith(
        new URL('https://logto.example.com/oidc/jwks'),
      );
    });
  });

  describe('constructor error handling', () => {
    it('should throw error when LOGTO_DOMAIN is not configured', async () => {
      const invalidConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'LOGTO_DOMAIN') return undefined;
          if (key === 'LOGTO_API_RESOURCE_INDICATOR') return 'api-resource';
          return undefined;
        }),
      } as any;

      await expect(
        Test.createTestingModule({
          providers: [
            LogtoTokenValidationService,
            {
              provide: ConfigService,
              useValue: invalidConfigService,
            },
          ],
        }).compile(),
      ).rejects.toThrow('LOGTO_DOMAIN environment variable is required');
    });

    it('should throw error when LOGTO_API_RESOURCE_INDICATOR is not configured', async () => {
      const invalidConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'LOGTO_DOMAIN') return 'https://logto.example.com';
          if (key === 'LOGTO_API_RESOURCE_INDICATOR') return undefined;
          return undefined;
        }),
      } as any;

      await expect(
        Test.createTestingModule({
          providers: [
            LogtoTokenValidationService,
            {
              provide: ConfigService,
              useValue: invalidConfigService,
            },
          ],
        }).compile(),
      ).rejects.toThrow(
        'LOGTO_API_RESOURCE_INDICATOR environment variable is required',
      );
    });
  });
});
