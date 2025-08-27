import { CreateOrganizationRequest } from '../types/logto-config';

// No default organizations - created on-demand by users
export const DEFAULT_ORGANIZATIONS: CreateOrganizationRequest[] = [];

// Organization roles - simplified for multi-tenant architecture
export const ORGANIZATION_ROLES = {
  owner: 'Organization owner with full control',
  admin: 'Administrator with management permissions',
  member: 'Regular member with basic access',
};

// Organization-specific scopes for API access
export const ORGANIZATION_SCOPES = [
  { name: 'organization:read', description: 'Read organization information' },
  {
    name: 'organization:write',
    description: 'Create and update organizations',
  },
  { name: 'organization:delete', description: 'Delete organizations' },
  { name: 'members:read', description: 'View organization members' },
  { name: 'members:write', description: 'Manage organization members' },
  { name: 'settings:read', description: 'View organization settings' },
  { name: 'settings:write', description: 'Update organization settings' },
];

// Organization setup configuration
export const ORGANIZATION_SETUP = {
  DEFAULT_ORGANIZATIONS,
  ORGANIZATION_ROLES,
  ORGANIZATION_SCOPES,

  // Schema naming configuration
  SCHEMA_PREFIX: 'org_',
  MAX_SCHEMA_LENGTH: 63,

  // Feature flags per organization type
  FEATURES: {
    education: ['courses', 'assessments', 'certificates'],
    mentorship: ['sessions', 'scheduling', 'feedback'],
    employer: ['jobs', 'candidates', 'interviews'],
  },
};
