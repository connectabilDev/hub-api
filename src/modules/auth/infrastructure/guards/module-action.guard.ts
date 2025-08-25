import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_ACTION_KEY } from '../decorators/module-action.decorator';
import { HubModule } from './module-access.guard';

export type ModuleAction =
  | 'view'
  | 'create'
  | 'manage'
  | 'moderate'
  | 'admin'
  | 'post'
  | 'apply'
  | 'schedule'
  | 'teach'
  | 'enroll'
  | 'review'
  | 'grade'
  | 'invite';

export interface ModuleActionMetadata {
  module: HubModule;
  action: ModuleAction;
  requireAll?: boolean;
}

@Injectable()
export class ModuleActionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<ModuleActionMetadata>(
      MODULE_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const { module, action } = metadata;
    const requiredScope = `${module}:${action}`;

    const hasAccess = user.hasScope(requiredScope);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied: You don't have permission to ${action} in the ${module} module. Required scope: ${requiredScope}`,
      );
    }

    return true;
  }
}
