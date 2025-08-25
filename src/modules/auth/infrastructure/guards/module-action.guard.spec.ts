import { Test, TestingModule } from '@nestjs/testing';
import { ModuleActionGuard, ModuleActionMetadata } from './module-action.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';

describe('ModuleActionGuard', () => {
  let guard: ModuleActionGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleActionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ModuleActionGuard>(ModuleActionGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let request: any;

    beforeEach(() => {
      request = {
        user: null,
      };

      context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as any;
    });

    it('should allow access when no metadata is provided', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const metadata: ModuleActionMetadata = {
        module: 'community',
        action: 'post',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(metadata);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User not authenticated',
      );
    });

    it('should allow access when user has the required scope', () => {
      const metadata: ModuleActionMetadata = {
        module: 'community',
        action: 'post',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(metadata);

      const user = new User({
        id: 'user-123',
        sub: 'user-123',
        email: 'test@example.com',
        scopes: ['community:view', 'community:post'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: 'test',
        iss: 'test',
      });
      request.user = user;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access when user lacks the required scope', () => {
      const metadata: ModuleActionMetadata = {
        module: 'community',
        action: 'moderate',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(metadata);

      const user = new User({
        id: 'user-123',
        sub: 'user-123',
        email: 'test@example.com',
        scopes: ['community:view', 'community:post'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: 'test',
        iss: 'test',
      });
      request.user = user;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        "Access denied: You don't have permission to moderate in the community module. Required scope: community:moderate",
      );
    });

    describe('different module actions', () => {
      const testCases = [
        { module: 'jobs', action: 'apply', scope: 'jobs:apply' },
        { module: 'jobs', action: 'create', scope: 'jobs:create' },
        {
          module: 'mentoring',
          action: 'schedule',
          scope: 'mentoring:schedule',
        },
        { module: 'education', action: 'teach', scope: 'education:teach' },
        { module: 'workspace', action: 'invite', scope: 'workspace:invite' },
      ];

      testCases.forEach(({ module, action, scope }) => {
        it(`should check ${scope} for ${module}:${action}`, () => {
          const metadata: ModuleActionMetadata = {
            module: module as any,
            action: action as any,
          };
          jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(metadata);

          const userWithScope = new User({
            id: 'user-123',
            sub: 'user-123',
            email: 'test@example.com',
            scopes: [scope],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            aud: 'test',
            iss: 'test',
          });
          request.user = userWithScope;
          expect(guard.canActivate(context)).toBe(true);

          const userWithoutScope = new User({
            id: 'user-456',
            sub: 'user-456',
            email: 'test2@example.com',
            scopes: ['other:scope'],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            aud: 'test',
            iss: 'test',
          });
          request.user = userWithoutScope;
          expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });
      });
    });

    it('should work with admin scope', () => {
      const metadata: ModuleActionMetadata = {
        module: 'community',
        action: 'admin',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(metadata);

      const adminUser = new User({
        id: 'admin-123',
        sub: 'admin-123',
        email: 'admin@example.com',
        scopes: ['community:admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: 'test',
        iss: 'test',
      });
      request.user = adminUser;

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });
  });
});
