export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export interface ConversationProps {
  id: string;
  type: ConversationType;
  name?: string;
  participantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  public readonly id: string;
  public readonly type: ConversationType;
  public readonly name?: string;
  public readonly participantIds: string[];
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: ConversationProps) {
    this.id = props.id;
    this.type = props.type;
    this.name = props.name;
    this.participantIds = props.participantIds;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<ConversationProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Conversation {
    if (
      props.type === ConversationType.DIRECT &&
      props.participantIds.length !== 2
    ) {
      throw new Error('Direct conversations must have exactly 2 participants');
    }

    if (
      props.type === ConversationType.GROUP &&
      props.participantIds.length < 3
    ) {
      throw new Error('Group conversations must have at least 3 participants');
    }

    return new Conversation({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  isDirect(): boolean {
    return this.type === ConversationType.DIRECT;
  }

  isGroup(): boolean {
    return this.type === ConversationType.GROUP;
  }

  hasParticipant(userId: string): boolean {
    return this.participantIds.includes(userId);
  }

  addParticipant(userId: string): Conversation {
    if (this.isDirect()) {
      throw new Error('Cannot add participants to direct conversations');
    }

    if (this.hasParticipant(userId)) {
      return this;
    }

    return new Conversation({
      ...this,
      participantIds: [...this.participantIds, userId],
      updatedAt: new Date(),
    });
  }

  removeParticipant(userId: string): Conversation {
    if (this.isDirect()) {
      throw new Error('Cannot remove participants from direct conversations');
    }

    if (!this.hasParticipant(userId)) {
      return this;
    }

    const updatedParticipants = this.participantIds.filter(
      (id) => id !== userId,
    );

    if (updatedParticipants.length < 2) {
      throw new Error('Conversation must have at least 2 participants');
    }

    return new Conversation({
      ...this,
      participantIds: updatedParticipants,
      updatedAt: new Date(),
    });
  }

  updateName(name: string): Conversation {
    if (this.isDirect()) {
      throw new Error('Cannot update name of direct conversations');
    }

    return new Conversation({
      ...this,
      name,
      updatedAt: new Date(),
    });
  }

  getOtherParticipant(userId: string): string | undefined {
    if (!this.isDirect()) {
      return undefined;
    }

    return this.participantIds.find((id) => id !== userId);
  }

  getParticipantCount(): number {
    return this.participantIds.length;
  }

  toJSON(): object {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      participantIds: this.participantIds,
      participantCount: this.getParticipantCount(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
