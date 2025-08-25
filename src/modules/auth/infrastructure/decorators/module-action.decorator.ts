import { SetMetadata } from '@nestjs/common';
import { HubModule } from '../guards/module-access.guard';
import {
  ModuleAction,
  ModuleActionMetadata,
} from '../guards/module-action.guard';

export const MODULE_ACTION_KEY = 'module-action';

export const RequireModuleAction = (module: HubModule, action: ModuleAction) =>
  SetMetadata<string, ModuleActionMetadata>(MODULE_ACTION_KEY, {
    module,
    action,
  });
