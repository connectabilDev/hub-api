import { WorkspaceRole } from '../../../domain/entities/workspace.entity';

export class InviteTeamMemberDto {
  workspaceId: string;
  inviterId: string;
  inviteeId: string;
  inviteeEmail: string;
  role: WorkspaceRole;

  constructor(data: Partial<InviteTeamMemberDto>) {
    Object.assign(this, data);
  }
}
