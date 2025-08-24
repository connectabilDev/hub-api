import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  SCOPES_KEY,
  REQUIRE_ALL_SCOPES_KEY,
} from '../decorators/scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const requireAll = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRequiredScopes = requireAll
      ? user.hasAllScopes(requiredScopes)
      : user.hasAnyScope(requiredScopes);

    if (!hasRequiredScopes) {
      const scopeNames = requiredScopes.join(', ');
      const message = requireAll
        ? `User must have all of the following scopes: ${scopeNames}`
        : `User must have at least one of the following scopes: ${scopeNames}`;
      throw new ForbiddenException(message);
    }

    return true;
  }
}
