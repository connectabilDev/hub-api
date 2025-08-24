import { User, UserRole } from './user.entity';

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

  describe('Multi-role Hub scenarios', () => {
    describe('hasAnyRole', () => {
      it('should return true when user has at least one of the required roles', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.CANDIDATE, UserRole.MENTOR],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.hasAnyRole([UserRole.CANDIDATE, UserRole.EMPLOYER])).toBe(
          true,
        );
        expect(user.hasAnyRole([UserRole.MENTOR])).toBe(true);
        expect(user.hasAnyRole([UserRole.PROFESSOR, UserRole.EMPLOYER])).toBe(
          false,
        );
      });

      it('should handle mixed string and enum roles', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: ['Candidate', 'custom-role'],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.hasAnyRole([UserRole.CANDIDATE, 'custom-role'])).toBe(true);
        expect(user.hasAnyRole(['unknown-role', UserRole.EMPLOYER])).toBe(
          false,
        );
      });
    });

    describe('hasAllRoles', () => {
      it('should return true only when user has all required roles', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.CANDIDATE, UserRole.MENTOR, UserRole.PROFESSOR],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.hasAllRoles([UserRole.CANDIDATE, UserRole.MENTOR])).toBe(
          true,
        );
        expect(user.hasAllRoles([UserRole.CANDIDATE])).toBe(true);
        expect(user.hasAllRoles([UserRole.CANDIDATE, UserRole.EMPLOYER])).toBe(
          false,
        );
      });

      it('should return false when user lacks any required role', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.CANDIDATE],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.hasAllRoles([UserRole.CANDIDATE, UserRole.MENTOR])).toBe(
          false,
        );
      });
    });

    describe('Hub-specific role methods', () => {
      it('should correctly identify candidate users', () => {
        const candidateUser = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.CANDIDATE, UserRole.MENTOR],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(candidateUser.isCandidate()).toBe(true);
        expect(candidateUser.isEmployer()).toBe(false);
      });

      it('should correctly identify employer users', () => {
        const employerUser = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.EMPLOYER],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(employerUser.isEmployer()).toBe(true);
        expect(employerUser.isCandidate()).toBe(false);
      });

      it('should correctly identify mentor users', () => {
        const mentorUser = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.MENTOR, UserRole.CANDIDATE],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(mentorUser.isMentor()).toBe(true);
        expect(mentorUser.isCandidate()).toBe(true);
        expect(mentorUser.isProfessor()).toBe(false);
      });

      it('should correctly identify professor users', () => {
        const professorUser = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.PROFESSOR],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(professorUser.isProfessor()).toBe(true);
        expect(professorUser.isMentor()).toBe(false);
      });

      it('should correctly identify admin users', () => {
        const adminUser = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.ADMIN],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(adminUser.isAdmin()).toBe(true);
        expect(adminUser.isCandidate()).toBe(false);
      });

      it('should handle users with multiple Hub roles', () => {
        const multiRoleUser = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.CANDIDATE, UserRole.MENTOR, UserRole.PROFESSOR],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(multiRoleUser.isCandidate()).toBe(true);
        expect(multiRoleUser.isMentor()).toBe(true);
        expect(multiRoleUser.isProfessor()).toBe(true);
        expect(multiRoleUser.isEmployer()).toBe(false);
        expect(multiRoleUser.isAdmin()).toBe(false);
      });
    });

    describe('Scopes', () => {
      it('should handle module-specific scopes', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.MENTOR],
          scopes: ['mentoria:view', 'mentoria:create', 'mentoria:schedule'],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.hasScope('mentoria:view')).toBe(true);
        expect(user.hasScope('mentoria:create')).toBe(true);
        expect(user.hasScope('vagas:view')).toBe(false);
      });

      it('should check for any of multiple scopes', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.CANDIDATE],
          scopes: ['vagas:view', 'vagas:apply'],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.hasAnyScope(['vagas:view', 'mentoria:view'])).toBe(true);
        expect(user.hasAnyScope(['educacao:view', 'educacao:teach'])).toBe(
          false,
        );
      });

      it('should check for all required scopes', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.PROFESSOR],
          scopes: ['educacao:view', 'educacao:teach', 'educacao:manage'],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.hasAllScopes(['educacao:view', 'educacao:teach'])).toBe(
          true,
        );
        expect(user.hasAllScopes(['educacao:view', 'educacao:enroll'])).toBe(
          false,
        );
      });
    });

    describe('Organizations', () => {
      it('should check if user is in organization', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.MENTOR],
          organizations: ['mentoria-tech', 'comunidade-dev'],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.isInOrganization('mentoria-tech')).toBe(true);
        expect(user.isInOrganization('vagas-it')).toBe(false);
      });

      it('should get organization role', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.MENTOR],
          organizationRoles: [
            'mentoria-tech:mentor',
            'comunidade-dev:moderator',
          ],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        expect(user.getOrganizationRole('mentoria-tech')).toBe('mentor');
        expect(user.getOrganizationRole('comunidade-dev')).toBe('moderator');
        expect(user.getOrganizationRole('vagas-it')).toBeUndefined();
      });
    });

    describe('Complex multi-context scenarios', () => {
      it('should handle user who is both candidate and mentor', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.CANDIDATE, UserRole.MENTOR],
          scopes: [
            'vagas:view',
            'vagas:apply',
            'mentoria:view',
            'mentoria:create',
            'mentoria:schedule',
          ],
          organizations: ['vagas-it', 'mentoria-tech'],
          organizationRoles: ['vagas-it:candidate', 'mentoria-tech:mentor'],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        // Check roles
        expect(user.isCandidate()).toBe(true);
        expect(user.isMentor()).toBe(true);

        // Check scopes for vagas module (as candidate)
        expect(user.hasScope('vagas:view')).toBe(true);
        expect(user.hasScope('vagas:apply')).toBe(true);
        expect(user.hasScope('vagas:manage')).toBe(false);

        // Check scopes for mentoria module (as mentor)
        expect(user.hasScope('mentoria:create')).toBe(true);
        expect(user.hasScope('mentoria:schedule')).toBe(true);

        // Check organizations
        expect(user.isInOrganization('vagas-it')).toBe(true);
        expect(user.isInOrganization('mentoria-tech')).toBe(true);
        expect(user.getOrganizationRole('vagas-it')).toBe('candidate');
        expect(user.getOrganizationRole('mentoria-tech')).toBe('mentor');
      });

      it('should handle user who is employer and professor', () => {
        const user = new User({
          id: 'user-123',
          email: 'test@example.com',
          sub: 'logto-sub-123',
          roles: [UserRole.EMPLOYER, UserRole.PROFESSOR],
          scopes: [
            'vagas:view',
            'vagas:manage',
            'educacao:view',
            'educacao:teach',
            'educacao:manage',
          ],
          organizations: ['vagas-it', 'educacao-digital'],
          organizationRoles: [
            'vagas-it:employer',
            'educacao-digital:professor',
          ],
          iat: 1640995200,
          exp: 1641081600,
          aud: 'api-resource',
          iss: 'https://logto.example.com/oidc',
        });

        // Check roles
        expect(user.isEmployer()).toBe(true);
        expect(user.isProfessor()).toBe(true);
        expect(user.isCandidate()).toBe(false);

        // Check employer permissions
        expect(user.hasScope('vagas:manage')).toBe(true);

        // Check professor permissions
        expect(user.hasScope('educacao:teach')).toBe(true);
        expect(user.hasScope('educacao:manage')).toBe(true);

        // Check organization roles
        expect(user.getOrganizationRole('vagas-it')).toBe('employer');
        expect(user.getOrganizationRole('educacao-digital')).toBe('professor');
      });
    });
  });
});
