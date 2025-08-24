import {
  InvalidTokenError,
  TokenExpiredError,
  UnauthorizedError,
  JwksError,
} from './auth.errors';

describe('Auth Errors', () => {
  describe('InvalidTokenError', () => {
    it('should create error with default message', () => {
      const error = new InvalidTokenError();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidTokenError');
      expect(error.message).toBe('Invalid token provided');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Token signature is invalid';
      const error = new InvalidTokenError(customMessage);

      expect(error.message).toBe(customMessage);
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new InvalidTokenError('Token error', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('TokenExpiredError', () => {
    it('should create error with default message', () => {
      const error = new TokenExpiredError();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('TokenExpiredError');
      expect(error.message).toBe('Token has expired');
    });

    it('should create error with custom message', () => {
      const customMessage = 'JWT token expired at specific time';
      const error = new TokenExpiredError(customMessage);

      expect(error.message).toBe(customMessage);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.message).toBe('Unauthorized access');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Insufficient permissions';
      const error = new UnauthorizedError(customMessage);

      expect(error.message).toBe(customMessage);
    });
  });

  describe('JwksError', () => {
    it('should create error with default message', () => {
      const error = new JwksError();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('JwksError');
      expect(error.message).toBe('Failed to retrieve or parse JWKS');
    });

    it('should create error with custom message', () => {
      const customMessage = 'JWKS endpoint unreachable';
      const error = new JwksError(customMessage);

      expect(error.message).toBe(customMessage);
    });

    it('should create error with cause', () => {
      const cause = new Error('Network error');
      const error = new JwksError('JWKS fetch failed', cause);

      expect(error.cause).toBe(cause);
    });
  });
});
