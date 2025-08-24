import { Module } from '@nestjs/common';
import { DatabaseModule } from '../shared/infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';
import { WORKSPACE_REPOSITORY } from './domain/repositories/workspace.repository.interface';
import { WORKSPACE_MEMBER_REPOSITORY } from './domain/repositories/workspace-member.repository.interface';
import { WorkspaceRepositoryImpl } from './infrastructure/repositories/workspace.repository.impl';
import { WorkspaceMemberRepositoryImpl } from './infrastructure/repositories/workspace-member.repository.impl';
import { CreateWorkspaceUseCase } from './application/use-cases/create-workspace/create-workspace.use-case';
import { InviteTeamMemberUseCase } from './application/use-cases/invite-team-member/invite-team-member.use-case';
import { AutoCreateWorkspaceUseCase } from './application/use-cases/auto-create-workspace/auto-create-workspace.use-case';

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [
    {
      provide: WORKSPACE_REPOSITORY,
      useClass: WorkspaceRepositoryImpl,
    },
    {
      provide: WORKSPACE_MEMBER_REPOSITORY,
      useClass: WorkspaceMemberRepositoryImpl,
    },
    CreateWorkspaceUseCase,
    InviteTeamMemberUseCase,
    AutoCreateWorkspaceUseCase,
  ],
  exports: [
    WORKSPACE_REPOSITORY,
    WORKSPACE_MEMBER_REPOSITORY,
    CreateWorkspaceUseCase,
    InviteTeamMemberUseCase,
    AutoCreateWorkspaceUseCase,
  ],
})
export class WorkspacesModule {}
