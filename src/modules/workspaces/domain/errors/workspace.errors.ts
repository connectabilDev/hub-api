export class WorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceError';
  }
}

export class WorkspaceNotFoundError extends WorkspaceError {
  constructor(workspaceId: string) {
    super(`Workspace with ID ${workspaceId} not found`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class WorkspaceAlreadyExistsError extends WorkspaceError {
  constructor(ownerId: string, type: string) {
    super(`Workspace of type ${type} already exists for owner ${ownerId}`);
    this.name = 'WorkspaceAlreadyExistsError';
  }
}

export class InvalidWorkspaceRoleError extends WorkspaceError {
  constructor(role: string, workspaceType: string) {
    super(`Role ${role} is not valid for workspace type ${workspaceType}`);
    this.name = 'InvalidWorkspaceRoleError';
  }
}

export class UnauthorizedWorkspaceAccessError extends WorkspaceError {
  constructor(userId: string, workspaceId: string) {
    super(
      `User ${userId} is not authorized to access workspace ${workspaceId}`,
    );
    this.name = 'UnauthorizedWorkspaceAccessError';
  }
}

export class WorkspaceMemberNotFoundError extends WorkspaceError {
  constructor(memberId: string, workspaceId?: string) {
    const message = workspaceId
      ? `Member ${memberId} not found in workspace ${workspaceId}`
      : `Workspace member with ID ${memberId} not found`;
    super(message);
    this.name = 'WorkspaceMemberNotFoundError';
  }
}

export class WorkspaceMemberAlreadyExistsError extends WorkspaceError {
  constructor(userId: string, workspaceId: string) {
    super(`User ${userId} is already a member of workspace ${workspaceId}`);
    this.name = 'WorkspaceMemberAlreadyExistsError';
  }
}

export class InsufficientWorkspacePermissionsError extends WorkspaceError {
  constructor(action: string) {
    super(`Insufficient permissions to perform action: ${action}`);
    this.name = 'InsufficientWorkspacePermissionsError';
  }
}
