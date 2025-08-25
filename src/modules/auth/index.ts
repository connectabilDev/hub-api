export { AuthModule } from './auth.module';
export { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
export { RolesGuard } from './infrastructure/guards/roles.guard';
export { ScopesGuard } from './infrastructure/guards/scopes.guard';
export { ModuleAccessGuard } from './infrastructure/guards/module-access.guard';
export { ModuleActionGuard } from './infrastructure/guards/module-action.guard';
export { Public } from './infrastructure/decorators/public.decorator';
export { CurrentUser } from './infrastructure/decorators/current-user.decorator';
export {
  Roles,
  RequireAllRoles,
} from './infrastructure/decorators/roles.decorator';
export {
  Scopes,
  RequireAllScopes,
} from './infrastructure/decorators/scopes.decorator';
export { RequireModule } from './infrastructure/decorators/module.decorator';
export { RequireModuleAction } from './infrastructure/decorators/module-action.decorator';
export { AuthMiddleware } from './infrastructure/middleware/auth.middleware';
export { User, UserRole } from './domain/entities/user.entity';
export * from './domain/errors/auth.errors';
