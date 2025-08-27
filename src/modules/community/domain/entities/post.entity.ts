export enum PostVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  GROUP = 'group',
  PRIVATE = 'private',
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnailUrl?: string;
  filename?: string;
  size: number;
}

export interface PostProps {
  id: string;
  userId: string;
  content: string;
  visibility: PostVisibility;
  media: MediaItem[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Post {
  public readonly id: string;
  public readonly userId: string;
  public readonly content: string;
  public readonly visibility: PostVisibility;
  public readonly media: MediaItem[];
  public readonly tags: string[];
  public readonly likesCount: number;
  public readonly commentsCount: number;
  public readonly sharesCount: number;
  public readonly likedByUserIds: string[];
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: PostProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.content = props.content;
    this.visibility = props.visibility;
    this.media = props.media;
    this.tags = props.tags;
    this.likesCount = props.likesCount;
    this.commentsCount = props.commentsCount;
    this.sharesCount = props.sharesCount;
    this.likedByUserIds = props.likedByUserIds;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<
      PostProps,
      | 'id'
      | 'likesCount'
      | 'commentsCount'
      | 'sharesCount'
      | 'likedByUserIds'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): Post {
    return new Post({
      ...props,
      id: crypto.randomUUID(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedByUserIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: PostProps): Post {
    return new Post(props);
  }

  like(userId: string): Post {
    if (this.likedByUserIds.includes(userId)) {
      return this;
    }

    return new Post({
      ...this,
      likesCount: this.likesCount + 1,
      likedByUserIds: [...this.likedByUserIds, userId],
      updatedAt: new Date(),
    });
  }

  unlike(userId: string): Post {
    if (!this.likedByUserIds.includes(userId)) {
      return this;
    }

    return new Post({
      ...this,
      likesCount: Math.max(0, this.likesCount - 1),
      likedByUserIds: this.likedByUserIds.filter((id) => id !== userId),
      updatedAt: new Date(),
    });
  }

  canEdit(userId: string): boolean {
    return this.userId === userId;
  }

  canDelete(userId: string): boolean {
    return this.userId === userId;
  }

  isLikedBy(userId: string): boolean {
    return this.likedByUserIds.includes(userId);
  }

  incrementCommentsCount(): Post {
    return new Post({
      ...this,
      commentsCount: this.commentsCount + 1,
      updatedAt: new Date(),
    });
  }

  decrementCommentsCount(): Post {
    return new Post({
      ...this,
      commentsCount: Math.max(0, this.commentsCount - 1),
      updatedAt: new Date(),
    });
  }

  incrementSharesCount(): Post {
    return new Post({
      ...this,
      sharesCount: this.sharesCount + 1,
      updatedAt: new Date(),
    });
  }

  toJSON(): object {
    return {
      id: this.id,
      userId: this.userId,
      content: this.content,
      visibility: this.visibility,
      media: this.media,
      tags: this.tags,
      likesCount: this.likesCount,
      commentsCount: this.commentsCount,
      sharesCount: this.sharesCount,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
