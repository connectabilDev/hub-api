export enum WorkspaceType {
  PROFESSOR = 'professor_workspace',
  MENTOR = 'mentor_workspace',
  EMPLOYER = 'employer_workspace',
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ASSISTANT = 'assistant',
  MODERATOR = 'moderator',
  CO_PROFESSOR = 'co_professor',
  CO_MENTOR = 'co_mentor',
  RECRUITER = 'recruiter',
  HR_ANALYST = 'hr_analyst',
  HIRING_MANAGER = 'hiring_manager',
}

export interface WorkspaceProps {
  id: string;
  organizationId: string;
  ownerId: string;
  name: string;
  type: WorkspaceType;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Workspace {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly ownerId: string;
  public readonly name: string;
  public readonly type: WorkspaceType;
  public readonly description?: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: WorkspaceProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.type = props.type;
    this.description = props.description;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<WorkspaceProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Workspace {
    return new Workspace({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  isProfessorWorkspace(): boolean {
    return this.type === WorkspaceType.PROFESSOR;
  }

  isMentorWorkspace(): boolean {
    return this.type === WorkspaceType.MENTOR;
  }

  isEmployerWorkspace(): boolean {
    return this.type === WorkspaceType.EMPLOYER;
  }

  getAllowedRoles(): WorkspaceRole[] {
    switch (this.type) {
      case WorkspaceType.PROFESSOR:
        return [
          WorkspaceRole.OWNER,
          WorkspaceRole.ASSISTANT,
          WorkspaceRole.MODERATOR,
          WorkspaceRole.CO_PROFESSOR,
        ];
      case WorkspaceType.MENTOR:
        return [
          WorkspaceRole.OWNER,
          WorkspaceRole.CO_MENTOR,
          WorkspaceRole.ASSISTANT,
        ];
      case WorkspaceType.EMPLOYER:
        return [
          WorkspaceRole.OWNER,
          WorkspaceRole.RECRUITER,
          WorkspaceRole.HR_ANALYST,
          WorkspaceRole.HIRING_MANAGER,
        ];
      default:
        return [WorkspaceRole.OWNER];
    }
  }

  isRoleAllowed(role: WorkspaceRole): boolean {
    return this.getAllowedRoles().includes(role);
  }
}
