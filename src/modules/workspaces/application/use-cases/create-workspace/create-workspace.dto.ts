import { WorkspaceType } from '../../../domain/entities/workspace.entity';

export class CreateWorkspaceDto {
  organizationId: string;
  ownerId: string;
  ownerName: string;
  type: WorkspaceType;
  description?: string;

  constructor(data: Partial<CreateWorkspaceDto>) {
    Object.assign(this, data);
  }
}
