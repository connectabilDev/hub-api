import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { UserRole, User } from '../../domain/entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockExecutionContext = (user?: User): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as any;
  };

  const createMockUser = (roles: string[] = []): User => {
    return new User({
      id: 'user-123',
      email: 'test@example.com',
      sub: 'sub-123',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: 'https://api.example.com',
      iss: 'https://logto.example.com',
      roles,
      scopes: [],
      organizations: [],
      organizationRoles: [],
    });
  };

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext();

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when empty roles array is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const context = createMockExecutionContext();

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([UserRole.CANDIDATE])
        .mockReturnValueOnce(false);

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    describe('when requireAll is false (default)', () => {
      it('should return true when user has at least one required role', () => {
        const user = createMockUser([UserRole.CANDIDATE, UserRole.MENTOR]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce([UserRole.CANDIDATE, UserRole.EMPLOYER])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should throw ForbiddenException when user has none of the required roles', () => {
        const user = createMockUser([UserRole.PROFESSOR]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce([UserRole.CANDIDATE, UserRole.EMPLOYER])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(() => guard.canActivate(context)).toThrow(
          new ForbiddenException(
            'User must have at least one of the following roles: Candidate, Employer',
          ),
        );
      });
    });

    describe('when requireAll is true', () => {
      it('should return true when user has all required roles', () => {
        const user = createMockUser([
          UserRole.CANDIDATE,
          UserRole.MENTOR,
          UserRole.PROFESSOR,
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce([UserRole.CANDIDATE, UserRole.MENTOR])
          .mockReturnValueOnce(true);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should throw ForbiddenException when user lacks any required role', () => {
        const user = createMockUser([UserRole.CANDIDATE]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce([UserRole.CANDIDATE, UserRole.MENTOR])
          .mockReturnValueOnce(true);

        const context = createMockExecutionContext(user);

        expect(() => guard.canActivate(context)).toThrow(
          new ForbiddenException(
            'User must have all of the following roles: Candidate, Mentor',
          ),
        );
      });
    });

    describe('multi-role scenarios', () => {
      it('should allow user with multiple roles to access candidate-only endpoint', () => {
        const user = createMockUser([UserRole.CANDIDATE, UserRole.MENTOR]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce([UserRole.CANDIDATE])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should allow user with multiple roles to access mentor-only endpoint', () => {
        const user = createMockUser([UserRole.CANDIDATE, UserRole.MENTOR]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce([UserRole.MENTOR])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should handle admin role with special privileges', () => {
        const user = createMockUser([UserRole.ADMIN]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce([UserRole.ADMIN])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should handle custom string roles', () => {
        const user = createMockUser(['custom-role', 'another-role']);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['custom-role'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });
    });
  });
});
