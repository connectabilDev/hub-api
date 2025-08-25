import { SetMetadata } from '@nestjs/common';
import { HubModule } from '../guards/module-access.guard';

export const MODULE_KEY = 'module';

export const RequireModule = (module: HubModule) =>
  SetMetadata(MODULE_KEY, module);
