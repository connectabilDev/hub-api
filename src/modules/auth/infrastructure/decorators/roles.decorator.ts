import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | string)[]) =>
  SetMetadata(ROLES_KEY, roles);

export const REQUIRE_ALL_ROLES_KEY = 'requireAllRoles';
export const RequireAllRoles = () => SetMetadata(REQUIRE_ALL_ROLES_KEY, true);
