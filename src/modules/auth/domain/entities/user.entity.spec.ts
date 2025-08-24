import { User } from './user.entity';

describe('User Entity', () => {
  describe('constructor', () => {
    it('should create a user with valid data', () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        roles: ['user'],
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      };

      const user = new User(userData);

      expect(user.id).toBe(userData.id);
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.picture).toBe(userData.picture);
      expect(user.roles).toEqual(userData.roles);
      expect(user.sub).toBe(userData.sub);
      expect(user.iat).toBe(userData.iat);
      expect(user.exp).toBe(userData.exp);
      expect(user.aud).toBe(userData.aud);
      expect(user.iss).toBe(userData.iss);
    });

    it('should create a user with minimum required data', () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      };

      const user = new User(userData);

      expect(user.id).toBe(userData.id);
      expect(user.email).toBe(userData.email);
      expect(user.name).toBeUndefined();
      expect(user.picture).toBeUndefined();
      expect(user.roles).toEqual([]);
    });

    it('should throw error when id is missing', () => {
      const userData = {
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      } as any;

      expect(() => new User(userData)).toThrow('User ID is required');
    });

    it('should throw error when email is missing', () => {
      const userData = {
        id: 'user-123',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      } as any;

      expect(() => new User(userData)).toThrow('User email is required');
    });

    it('should throw error when sub is missing', () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      } as any;

      expect(() => new User(userData)).toThrow('User sub is required');
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        roles: ['admin', 'user'],
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      expect(user.hasRole('admin')).toBe(true);
      expect(user.hasRole('user')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        roles: ['user'],
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      expect(user.hasRole('admin')).toBe(false);
    });

    it('should return false when user has no roles', () => {
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: 1641081600,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      expect(user.hasRole('admin')).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false when token is still valid', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: futureTimestamp,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      expect(user.isTokenExpired()).toBe(false);
    });

    it('should return true when token is expired', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const user = new User({
        id: 'user-123',
        email: 'test@example.com',
        sub: 'logto-sub-123',
        iat: 1640995200,
        exp: pastTimestamp,
        aud: 'api-resource',
        iss: 'https://logto.example.com/oidc',
      });

      expect(user.isTokenExpired()).toBe(true);
    });
  });
});
