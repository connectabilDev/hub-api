export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  SYSTEM = 'system',
}

export interface MessageProps {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Message {
  public readonly id: string;
  public readonly conversationId: string;
  public readonly senderId: string;
  public readonly type: MessageType;
  public readonly content: string;
  public readonly mediaUrl?: string;
  public readonly isRead: boolean;
  public readonly isEdited: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: MessageProps) {
    this.id = props.id;
    this.conversationId = props.conversationId;
    this.senderId = props.senderId;
    this.type = props.type;
    this.content = props.content;
    this.mediaUrl = props.mediaUrl;
    this.isRead = props.isRead;
    this.isEdited = props.isEdited;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<
      MessageProps,
      'id' | 'isRead' | 'isEdited' | 'createdAt' | 'updatedAt'
    >,
  ): Message {
    return new Message({
      ...props,
      id: crypto.randomUUID(),
      isRead: false,
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  markAsRead(): Message {
    if (this.isRead) {
      return this;
    }

    return new Message({
      ...this,
      isRead: true,
      updatedAt: new Date(),
    });
  }

  edit(newContent: string): Message {
    if (this.content === newContent) {
      return this;
    }

    return new Message({
      ...this,
      content: newContent,
      isEdited: true,
      updatedAt: new Date(),
    });
  }

  canEdit(userId: string): boolean {
    return this.senderId === userId && this.type === MessageType.TEXT;
  }

  canDelete(userId: string): boolean {
    return this.senderId === userId;
  }

  isTextMessage(): boolean {
    return this.type === MessageType.TEXT;
  }

  isMediaMessage(): boolean {
    return [
      MessageType.IMAGE,
      MessageType.VIDEO,
      MessageType.DOCUMENT,
    ].includes(this.type);
  }

  isSystemMessage(): boolean {
    return this.type === MessageType.SYSTEM;
  }

  hasMedia(): boolean {
    return this.mediaUrl !== undefined && this.mediaUrl !== '';
  }

  getAgeInMinutes(): number {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60));
  }

  canEditTimeWindow(windowMinutes: number = 15): boolean {
    return this.getAgeInMinutes() <= windowMinutes;
  }

  toJSON(): object {
    return {
      id: this.id,
      conversationId: this.conversationId,
      senderId: this.senderId,
      type: this.type,
      content: this.content,
      mediaUrl: this.mediaUrl,
      isRead: this.isRead,
      isEdited: this.isEdited,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
