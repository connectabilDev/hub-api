import { Test, TestingModule } from '@nestjs/testing';
import { ModuleAccessGuard } from './module-access.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';

describe('ModuleAccessGuard', () => {
  let guard: ModuleAccessGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleAccessGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ModuleAccessGuard>(ModuleAccessGuard);
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

    it('should allow access when no module is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('community');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User not authenticated',
      );
    });

    it('should allow access when user has the required module:view scope', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('community');

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

    it('should deny access when user lacks the required module:view scope', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('community');

      const user = new User({
        id: 'user-123',
        sub: 'user-123',
        email: 'test@example.com',
        scopes: ['jobs:view', 'mentoring:view'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: 'test',
        iss: 'test',
      });
      request.user = user;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        "Access denied: You don't have access to the community module. Required scope: community:view",
      );
    });

    it('should work with different modules', () => {
      const modules = ['jobs', 'mentoring', 'education'];

      modules.forEach((module) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(module);

        const userWithAccess = new User({
          id: 'user-123',
          sub: 'user-123',
          email: 'test@example.com',
          scopes: [`${module}:view`],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          aud: 'test',
          iss: 'test',
        });
        request.user = userWithAccess;

        expect(guard.canActivate(context)).toBe(true);

        const userWithoutAccess = new User({
          id: 'user-456',
          sub: 'user-456',
          email: 'test2@example.com',
          scopes: ['other:view'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          aud: 'test',
          iss: 'test',
        });
        request.user = userWithoutAccess;

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });
    });
  });
});
