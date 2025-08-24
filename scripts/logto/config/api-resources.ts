import { CreateResourceRequest } from '../types/logto-config';

export const createApiResourceConfigs = (
  apiResourceIndicator: string,
): CreateResourceRequest[] => [
  {
    name: 'Hub API',
    indicator: apiResourceIndicator,
    accessTokenTtl: 3600,
    scopes: [
      {
        name: 'read',
        description: 'Read access to API resources',
      },
      {
        name: 'write',
        description: 'Write access to API resources',
      },
      {
        name: 'delete',
        description: 'Delete access to API resources',
      },
      {
        name: 'admin',
        description: 'Full administrative access',
      },
      {
        name: 'users:read',
        description: 'Read user information',
      },
      {
        name: 'users:write',
        description: 'Create and update users',
      },
      {
        name: 'users:delete',
        description: 'Delete users',
      },
      {
        name: 'organizations:read',
        description: 'Read organization information',
      },
      {
        name: 'organizations:write',
        description: 'Create and update organizations',
      },
      {
        name: 'organizations:admin',
        description: 'Full organization administration',
      },
    ],
  },
];
