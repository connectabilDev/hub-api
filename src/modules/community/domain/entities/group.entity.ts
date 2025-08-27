export enum GroupPrivacy {
  PUBLIC = 'public',
  CLOSED = 'closed',
  SECRET = 'secret',
}

export enum GroupCategory {
  GENERAL = 'general',
  PROFESSIONAL = 'professional',
  EDUCATIONAL = 'educational',
  HOBBY = 'hobby',
  SUPPORT = 'support',
  TECHNOLOGY = 'technology',
  HEALTH = 'health',
  SPORTS = 'sports',
  ARTS = 'arts',
  BUSINESS = 'business',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export interface GroupRule {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface GroupProps {
  id: string;
  name: string;
  description: string;
  privacy: GroupPrivacy;
  category: GroupCategory;
  rules: GroupRule[];
  ownerId: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Group {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly privacy: GroupPrivacy;
  public readonly category: GroupCategory;
  public readonly rules: GroupRule[];
  public readonly ownerId: string;
  public readonly memberCount: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: GroupProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.privacy = props.privacy;
    this.category = props.category;
    this.rules = props.rules;
    this.ownerId = props.ownerId;
    this.memberCount = props.memberCount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<GroupProps, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'>,
  ): Group {
    return new Group({
      ...props,
      id: crypto.randomUUID(),
      memberCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  canJoin(_userId: string): boolean {
    if (this.privacy === GroupPrivacy.PUBLIC) {
      return true;
    }

    if (this.privacy === GroupPrivacy.SECRET) {
      return false;
    }

    return this.privacy === GroupPrivacy.CLOSED;
  }

  canPost(userId: string, memberRole: MemberRole): boolean {
    if (userId === this.ownerId) {
      return true;
    }

    return [MemberRole.ADMIN, MemberRole.MODERATOR, MemberRole.MEMBER].includes(
      memberRole,
    );
  }

  canManage(userId: string, memberRole: MemberRole): boolean {
    if (userId === this.ownerId) {
      return true;
    }

    return [MemberRole.ADMIN, MemberRole.MODERATOR].includes(memberRole);
  }

  isPublic(): boolean {
    return this.privacy === GroupPrivacy.PUBLIC;
  }

  isClosed(): boolean {
    return this.privacy === GroupPrivacy.CLOSED;
  }

  isSecret(): boolean {
    return this.privacy === GroupPrivacy.SECRET;
  }

  incrementMemberCount(): Group {
    return new Group({
      ...this,
      memberCount: this.memberCount + 1,
      updatedAt: new Date(),
    });
  }

  decrementMemberCount(): Group {
    return new Group({
      ...this,
      memberCount: Math.max(1, this.memberCount - 1),
      updatedAt: new Date(),
    });
  }

  updateInfo(name?: string, description?: string): Group {
    return new Group({
      ...this,
      name: name ?? this.name,
      description: description ?? this.description,
      updatedAt: new Date(),
    });
  }

  addRule(title: string, description: string): Group {
    const newRule: GroupRule = {
      id: crypto.randomUUID(),
      title,
      description,
      order: this.rules.length + 1,
    };

    return new Group({
      ...this,
      rules: [...this.rules, newRule],
      updatedAt: new Date(),
    });
  }

  removeRule(ruleId: string): Group {
    const updatedRules = this.rules.filter((rule) => rule.id !== ruleId);

    return new Group({
      ...this,
      rules: updatedRules,
      updatedAt: new Date(),
    });
  }

  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      privacy: this.privacy,
      category: this.category,
      rules: this.rules,
      ownerId: this.ownerId,
      memberCount: this.memberCount,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
