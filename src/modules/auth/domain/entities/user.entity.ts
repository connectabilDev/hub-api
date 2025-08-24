export interface UserProps {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  roles?: string[];
  scopes?: string[];
  organizations?: string[];
  organizationRoles?: string[];
  sub: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export enum UserRole {
  ADMIN = 'Admin',
  CANDIDATE = 'Candidate',
  EMPLOYER = 'Employer',
  MENTOR = 'Mentor',
  PROFESSOR = 'Professor',
  USER = 'User',
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly name?: string;
  public readonly picture?: string;
  public readonly roles: string[];
  public readonly scopes: string[];
  public readonly organizations: string[];
  public readonly organizationRoles: string[];
  public readonly sub: string;
  public readonly iat: number;
  public readonly exp: number;
  public readonly aud: string;
  public readonly iss: string;

  constructor(props: UserProps) {
    if (!props.id) {
      throw new Error('User ID is required');
    }

    if (!props.email) {
      throw new Error('User email is required');
    }

    if (!props.sub) {
      throw new Error('User sub is required');
    }

    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.picture = props.picture;
    this.roles = props.roles || [];
    this.scopes = props.scopes || [];
    this.organizations = props.organizations || [];
    this.organizationRoles = props.organizationRoles || [];
    this.sub = props.sub;
    this.iat = props.iat;
    this.exp = props.exp;
    this.aud = props.aud;
    this.iss = props.iss;
  }

  hasRole(role: string | UserRole): boolean {
    return this.roles.includes(role);
  }

  hasAnyRole(roles: (string | UserRole)[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasAllRoles(roles: (string | UserRole)[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }

  hasScope(scope: string): boolean {
    return this.scopes.includes(scope);
  }

  hasAnyScope(scopes: string[]): boolean {
    return scopes.some((scope) => this.hasScope(scope));
  }

  hasAllScopes(scopes: string[]): boolean {
    return scopes.every((scope) => this.hasScope(scope));
  }

  isInOrganization(organizationId: string): boolean {
    return this.organizations.includes(organizationId);
  }

  getOrganizationRole(organizationId: string): string | undefined {
    const orgRole = this.organizationRoles.find((role) =>
      role.startsWith(`${organizationId}:`),
    );
    return orgRole ? orgRole.split(':')[1] : undefined;
  }

  isCandidate(): boolean {
    return this.hasRole(UserRole.CANDIDATE);
  }

  isEmployer(): boolean {
    return this.hasRole(UserRole.EMPLOYER);
  }

  isMentor(): boolean {
    return this.hasRole(UserRole.MENTOR);
  }

  isProfessor(): boolean {
    return this.hasRole(UserRole.PROFESSOR);
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isTokenExpired(): boolean {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return this.exp < currentTimestamp;
  }

  getWorkspaceRole(workspaceId: string): string | undefined {
    return this.getOrganizationRole(workspaceId);
  }

  isWorkspaceOwner(workspaceId: string): boolean {
    return this.getWorkspaceRole(workspaceId) === 'owner';
  }

  canManageWorkspace(workspaceId: string): boolean {
    const role = this.getWorkspaceRole(workspaceId);
    return (
      role === 'owner' ||
      role === 'assistant' ||
      role === 'co_professor' ||
      role === 'co_mentor'
    );
  }

  canModerateWorkspace(workspaceId: string): boolean {
    const role = this.getWorkspaceRole(workspaceId);
    return role === 'owner' || role === 'moderator';
  }

  canInviteToWorkspace(workspaceId: string): boolean {
    return this.isWorkspaceOwner(workspaceId);
  }

  getWorkspaces(): string[] {
    return this.organizations;
  }

  hasWorkspaceScope(scope: string): boolean {
    return this.scopes.includes(scope);
  }

  canCreateWorkspace(): boolean {
    return this.hasScope('workspace:create');
  }
}
