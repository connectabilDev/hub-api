import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from '../decorators/module.decorator';

export type HubModule = 'community' | 'jobs' | 'mentoring' | 'education';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModule = this.reflector.getAllAndOverride<HubModule>(
      MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const viewScope = `${requiredModule}:view`;

    const hasModuleAccess = user.hasScope(viewScope);

    if (!hasModuleAccess) {
      throw new ForbiddenException(
        `Access denied: You don't have access to the ${requiredModule} module. Required scope: ${viewScope}`,
      );
    }

    return true;
  }
}
