import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ScopesGuard } from './scopes.guard';
import { User } from '../../domain/entities/user.entity';

describe('ScopesGuard', () => {
  let guard: ScopesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScopesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ScopesGuard>(ScopesGuard);
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

  const createMockUser = (scopes: string[] = []): User => {
    return new User({
      id: 'user-123',
      email: 'test@example.com',
      sub: 'sub-123',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: 'https://api.example.com',
      iss: 'https://logto.example.com',
      roles: [],
      scopes,
      organizations: [],
      organizationRoles: [],
    });
  };

  describe('canActivate', () => {
    it('should return true when no scopes are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext();

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when empty scopes array is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const context = createMockExecutionContext();

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['mentoria:view'])
        .mockReturnValueOnce(false);

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    describe('when requireAll is false (default)', () => {
      it('should return true when user has at least one required scope', () => {
        const user = createMockUser(['mentoria:view', 'mentoria:create']);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['mentoria:view', 'vagas:view'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should throw ForbiddenException when user has none of the required scopes', () => {
        const user = createMockUser(['educacao:view']);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['mentoria:view', 'vagas:view'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(() => guard.canActivate(context)).toThrow(
          new ForbiddenException(
            'User must have at least one of the following scopes: mentoria:view, vagas:view',
          ),
        );
      });
    });

    describe('when requireAll is true', () => {
      it('should return true when user has all required scopes', () => {
        const user = createMockUser([
          'mentoria:view',
          'mentoria:create',
          'mentoria:schedule',
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['mentoria:view', 'mentoria:create'])
          .mockReturnValueOnce(true);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should throw ForbiddenException when user lacks any required scope', () => {
        const user = createMockUser(['mentoria:view']);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['mentoria:view', 'mentoria:create'])
          .mockReturnValueOnce(true);

        const context = createMockExecutionContext(user);

        expect(() => guard.canActivate(context)).toThrow(
          new ForbiddenException(
            'User must have all of the following scopes: mentoria:view, mentoria:create',
          ),
        );
      });
    });

    describe('module-specific scope scenarios', () => {
      it('should handle mentoria module scopes', () => {
        const user = createMockUser([
          'mentoria:view',
          'mentoria:create',
          'mentoria:schedule',
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['mentoria:schedule'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should handle vagas module scopes', () => {
        const user = createMockUser([
          'vagas:view',
          'vagas:apply',
          'vagas:manage',
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['vagas:manage'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should handle educacao module scopes', () => {
        const user = createMockUser([
          'educacao:view',
          'educacao:enroll',
          'educacao:teach',
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['educacao:teach'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should handle comunidade module scopes', () => {
        const user = createMockUser([
          'comunidade:view',
          'comunidade:participate',
          'comunidade:moderate',
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['comunidade:moderate'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should handle admin scopes', () => {
        const user = createMockUser([
          'admin:users',
          'admin:analytics',
          'admin:settings',
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['admin:users'])
          .mockReturnValueOnce(false);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });
    });

    describe('cross-module scenarios', () => {
      it('should handle user with scopes from multiple modules', () => {
        const user = createMockUser([
          'mentoria:view',
          'vagas:view',
          'educacao:view',
          'comunidade:view',
        ]);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['mentoria:view', 'vagas:view'])
          .mockReturnValueOnce(true);

        const context = createMockExecutionContext(user);

        expect(guard.canActivate(context)).toBe(true);
      });

      it('should reject user without required cross-module scopes', () => {
        const user = createMockUser(['mentoria:view', 'educacao:view']);
        jest
          .spyOn(reflector, 'getAllAndOverride')
          .mockReturnValueOnce(['mentoria:view', 'vagas:view'])
          .mockReturnValueOnce(true);

        const context = createMockExecutionContext(user);

        expect(() => guard.canActivate(context)).toThrow(
          new ForbiddenException(
            'User must have all of the following scopes: mentoria:view, vagas:view',
          ),
        );
      });
    });
  });
});
