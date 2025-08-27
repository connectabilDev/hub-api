import { CreateResourceRequest } from '../types/logto-config';

export const createApiResourceConfigs = (
  apiResourceIndicator: string,
): CreateResourceRequest[] => [
  {
    name: 'Hub API - Core',
    indicator: apiResourceIndicator,
    accessTokenTtl: 3600,
    scopes: [
      // Admin scopes
      { name: 'admin', description: 'Full administrative access' },

      // User management scopes
      { name: 'users:read', description: 'Read user information' },
      { name: 'users:write', description: 'Create and update users' },
      { name: 'users:delete', description: 'Delete users' },

      // Profile management
      { name: 'profile:read', description: 'Read own profile' },
      { name: 'profile:write', description: 'Update own profile' },

      // Mentoring module scopes
      {
        name: 'mentoring:view',
        description: 'View mentoring sessions and mentors',
      },
      { name: 'mentoring:create', description: 'Create mentoring sessions' },
      {
        name: 'mentoring:schedule',
        description: 'Schedule mentoring sessions',
      },
      {
        name: 'mentoring:manage',
        description: 'Manage own mentoring sessions',
      },
      {
        name: 'mentoring:review',
        description: 'Review and rate mentoring sessions',
      },
      {
        name: 'mentoring:admin',
        description: 'Full mentoring module administration',
      },

      // Jobs module scopes
      { name: 'jobs:view', description: 'View job listings' },
      { name: 'jobs:create', description: 'Create and publish job listings' },
      { name: 'jobs:apply', description: 'Apply to job listings' },
      { name: 'jobs:manage', description: 'Manage own job listings' },
      { name: 'jobs:review', description: 'Review applications' },
      { name: 'jobs:admin', description: 'Full job module administration' },

      // Education module scopes
      {
        name: 'education:view',
        description: 'View courses and educational content',
      },
      { name: 'education:create', description: 'Create courses and content' },
      { name: 'education:teach', description: 'Teach and manage courses' },
      { name: 'education:enroll', description: 'Enroll in courses' },
      { name: 'education:manage', description: 'Manage own courses' },
      {
        name: 'education:grade',
        description: 'Grade students and assignments',
      },
      {
        name: 'education:admin',
        description: 'Full education module administration',
      },

      // Community module scopes
      {
        name: 'community:view',
        description: 'View community posts and discussions',
      },
      { name: 'community:post', description: 'Create posts and comments' },
      { name: 'community:moderate', description: 'Moderate community content' },
      {
        name: 'community:manage',
        description: 'Manage own posts and comments',
      },
      { name: 'community:admin', description: 'Full community administration' },

      // Organization management scopes (multi-tenant)
      {
        name: 'organization:read',
        description: 'Read organization information',
      },
      {
        name: 'organization:write',
        description: 'Create and update organizations',
      },
      {
        name: 'organization:delete',
        description: 'Delete organizations',
      },
      {
        name: 'members:read',
        description: 'View organization members',
      },
      {
        name: 'members:write',
        description: 'Manage organization members',
      },
      {
        name: 'settings:read',
        description: 'View organization settings',
      },
      {
        name: 'settings:write',
        description: 'Update organization settings',
      },
    ],
  },
];
