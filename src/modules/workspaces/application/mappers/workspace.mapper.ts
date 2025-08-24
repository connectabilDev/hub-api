import { Workspace } from '../../domain/entities/workspace.entity';

export class WorkspaceResponseDto {
  id: string;
  organizationId: string;
  ownerId: string;
  name: string;
  type: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<WorkspaceResponseDto>) {
    Object.assign(this, data);
  }
}

export class WorkspaceMapper {
  static toResponseDto(workspace: Workspace): WorkspaceResponseDto {
    return new WorkspaceResponseDto({
      id: workspace.id,
      organizationId: workspace.organizationId,
      ownerId: workspace.ownerId,
      name: workspace.name,
      type: workspace.type,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  }

  static toResponseDtoList(workspaces: Workspace[]): WorkspaceResponseDto[] {
    return workspaces.map((workspace) => this.toResponseDto(workspace));
  }
}
