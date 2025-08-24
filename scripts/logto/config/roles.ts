import { CreateRoleRequest } from '../types/logto-config';

export const ROLES: CreateRoleRequest[] = [
  // Administrative roles
  {
    name: 'Admin',
    description: 'Full administrative access to all Hub resources and modules',
  },

  // User type roles
  {
    name: 'Candidate',
    description:
      'Job seeker who can apply to positions, book mentorships, and enroll in courses',
  },
  {
    name: 'Employer',
    description:
      'Company representative who can post job openings and manage applications',
  },
  {
    name: 'Mentor',
    description: 'Professional who can offer mentoring sessions and guidance',
  },
  {
    name: 'Professor',
    description: 'Educator who can create and teach courses',
  },

  // Base user role
  {
    name: 'User',
    description: 'Basic authenticated user with profile access',
  },
];

export const ROLE_SCOPE_MAPPINGS = {
  Admin: [
    'admin',
    'users:read',
    'users:write',
    'users:delete',
    'profile:read',
    'profile:write',
    'mentoring:admin',
    'jobs:admin',
    'education:admin',
    'community:admin',
  ],

  Candidate: [
    // Profile
    'profile:read',
    'profile:write',

    // Jobs - can view and apply
    'jobs:view',
    'jobs:apply',

    // Mentoring - can view and schedule
    'mentoring:view',
    'mentoring:schedule',
    'mentoring:review',

    // Education - can view and enroll
    'education:view',
    'education:enroll',

    // Community - can participate
    'community:view',
    'community:post',
    'community:manage',
  ],

  Employer: [
    // Profile
    'profile:read',
    'profile:write',

    // Jobs - full control over job postings
    'jobs:view',
    'jobs:create',
    'jobs:manage',
    'jobs:review',

    // Mentoring - can view and potentially hire mentors
    'mentoring:view',

    // Education - can view for employee training
    'education:view',

    // Community - can participate
    'community:view',
    'community:post',
    'community:manage',

    // Workspace - can create and manage workspace
    'workspace:create',
    'workspace:manage',
    'workspace:invite',
    'workspace:view',
  ],

  Mentor: [
    // Profile
    'profile:read',
    'profile:write',

    // Mentoring - full control over mentoring
    'mentoring:view',
    'mentoring:create',
    'mentoring:manage',

    // Jobs - can view opportunities
    'jobs:view',

    // Education - can view and potentially teach
    'education:view',

    // Community - can participate and share knowledge
    'community:view',
    'community:post',
    'community:manage',

    // Workspace - can create and manage workspace
    'workspace:create',
    'workspace:manage',
    'workspace:invite',
    'workspace:view',
  ],

  Professor: [
    // Profile
    'profile:read',
    'profile:write',

    // Education - full control over courses
    'education:view',
    'education:create',
    'education:teach',
    'education:manage',
    'education:grade',

    // Mentoring - can also be a mentor
    'mentoring:view',
    'mentoring:create',
    'mentoring:manage',

    // Jobs - can view opportunities
    'jobs:view',

    // Community - can participate and share knowledge
    'community:view',
    'community:post',
    'community:manage',

    // Workspace - can create and manage workspace
    'workspace:create',
    'workspace:manage',
    'workspace:invite',
    'workspace:view',
  ],

  User: [
    // Basic user permissions
    'profile:read',
    'profile:write',
    'community:view',
  ],
};
