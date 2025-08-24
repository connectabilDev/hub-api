import { CreateRoleRequest } from '../types/logto-config';

export const ROLES: CreateRoleRequest[] = [
  {
    name: 'Admin',
    description: 'Full administrative access to all resources',
  },
  {
    name: 'Manager',
    description:
      'Management access with organization administration capabilities',
  },
  {
    name: 'Member',
    description: 'Standard member access with read and write capabilities',
  },
  {
    name: 'Viewer',
    description: 'Read-only access to resources',
  },
];

export const ROLE_SCOPE_MAPPINGS = {
  Admin: [
    'admin',
    'users:read',
    'users:write',
    'users:delete',
    'organizations:read',
    'organizations:write',
    'organizations:admin',
  ],
  Manager: [
    'read',
    'write',
    'users:read',
    'users:write',
    'organizations:read',
    'organizations:write',
  ],
  Member: ['read', 'write', 'users:read', 'organizations:read'],
  Viewer: ['read', 'users:read', 'organizations:read'],
};
