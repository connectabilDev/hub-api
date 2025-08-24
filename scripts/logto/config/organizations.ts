import { CreateOrganizationRequest } from '../types/logto-config';

// Default organization for platform administration only
export const DEFAULT_ORGANIZATIONS: CreateOrganizationRequest[] = [
  {
    name: 'Hub Platform Admin',
    description: 'Main Hub platform organization for system administration',
  },
];

// Organization roles for workspace management teams
// These are NOT for students/mentees/candidates - they join through the app, not organizations
export const WORKSPACE_ORGANIZATION_ROLES = {
  // Professor workspace team roles
  professor_workspace: {
    owner: 'Workspace owner - full control',
    assistant: 'Teaching assistant - can manage content and answer questions',
    moderator: 'Content moderator - can moderate discussions and forums',
    co_professor: 'Co-professor - can teach and manage courses',
  },

  // Mentor workspace team roles
  mentor_workspace: {
    owner: 'Workspace owner - full control',
    co_mentor: 'Co-mentor - can conduct sessions and manage schedules',
    assistant: 'Mentoring assistant - can help with scheduling and support',
  },

  // Employer workspace team roles
  employer_workspace: {
    owner: 'Workspace owner - full control',
    recruiter: 'Recruiter - can manage job postings and review applications',
    hr_analyst: 'HR Analyst - can analyze candidates and generate reports',
    hiring_manager: 'Hiring Manager - can make hiring decisions',
  },

  // Platform admin team roles
  platform_admin: {
    admin: 'System administrator - full platform control',
    support: 'Support team - can help users and resolve issues',
    analyst: 'Platform analyst - can view metrics and generate reports',
  },
};

// Template names for auto-created workspaces
export const WORKSPACE_TEMPLATES = {
  PROFESSOR: (name: string) => `${name}'s Teaching Team`,
  MENTOR: (name: string) => `${name}'s Mentoring Team`,
  EMPLOYER: (company: string) => `${company} Hiring Team`,
};
