export interface CommentProps {
  id: string;
  postId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Comment {
  public readonly id: string;
  public readonly postId: string;
  public readonly userId: string;
  public readonly parentCommentId?: string;
  public readonly content: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: CommentProps) {
    this.id = props.id;
    this.postId = props.postId;
    this.userId = props.userId;
    this.parentCommentId = props.parentCommentId;
    this.content = props.content;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Comment {
    return new Comment({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  canEdit(userId: string): boolean {
    return this.userId === userId;
  }

  canDelete(userId: string): boolean {
    return this.userId === userId;
  }

  isReply(): boolean {
    return this.parentCommentId !== undefined;
  }

  edit(newContent: string): Comment {
    return new Comment({
      ...this,
      content: newContent,
      updatedAt: new Date(),
    });
  }

  toJSON(): object {
    return {
      id: this.id,
      postId: this.postId,
      userId: this.userId,
      parentCommentId: this.parentCommentId,
      content: this.content,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      isReply: this.isReply(),
    };
  }
}
