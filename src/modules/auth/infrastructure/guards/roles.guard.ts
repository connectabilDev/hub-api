import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  REQUIRE_ALL_ROLES_KEY,
} from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      (UserRole | string)[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const requireAll = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRequiredRoles = requireAll
      ? user.hasAllRoles(requiredRoles)
      : user.hasAnyRole(requiredRoles);

    if (!hasRequiredRoles) {
      const roleNames = requiredRoles.join(', ');
      const message = requireAll
        ? `User must have all of the following roles: ${roleNames}`
        : `User must have at least one of the following roles: ${roleNames}`;
      throw new ForbiddenException(message);
    }

    return true;
  }
}
