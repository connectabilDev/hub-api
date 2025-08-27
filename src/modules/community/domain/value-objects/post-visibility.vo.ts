export enum PostVisibilityType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  CONNECTIONS = 'CONNECTIONS',
  GROUP = 'GROUP',
}

export class PostVisibility {
  private readonly type: PostVisibilityType;

  private constructor(type: PostVisibilityType) {
    this.type = type;
  }

  static fromString(value: string): PostVisibility {
    const upperValue = value.toUpperCase();

    if (!this.isValid(upperValue)) {
      throw new Error(`Invalid post visibility: ${value}`);
    }

    return new PostVisibility(upperValue as PostVisibilityType);
  }

  static isValid(value: string): boolean {
    return Object.values(PostVisibilityType).includes(
      value as PostVisibilityType,
    );
  }

  static createPublic(): PostVisibility {
    return new PostVisibility(PostVisibilityType.PUBLIC);
  }

  static createPrivate(): PostVisibility {
    return new PostVisibility(PostVisibilityType.PRIVATE);
  }

  static createConnections(): PostVisibility {
    return new PostVisibility(PostVisibilityType.CONNECTIONS);
  }

  static createGroup(): PostVisibility {
    return new PostVisibility(PostVisibilityType.GROUP);
  }

  isPublic(): boolean {
    return this.type === PostVisibilityType.PUBLIC;
  }

  isPrivate(): boolean {
    return this.type === PostVisibilityType.PRIVATE;
  }

  isConnections(): boolean {
    return this.type === PostVisibilityType.CONNECTIONS;
  }

  isGroup(): boolean {
    return this.type === PostVisibilityType.GROUP;
  }

  canView(
    userId: string,
    connectionIds: string[] = [],
    groupMemberIds: string[] = [],
    authorId: string,
  ): boolean {
    if (userId === authorId) {
      return true;
    }

    switch (this.type) {
      case PostVisibilityType.PUBLIC:
        return true;

      case PostVisibilityType.PRIVATE:
        return false;

      case PostVisibilityType.CONNECTIONS:
        return connectionIds.includes(userId);

      case PostVisibilityType.GROUP:
        return groupMemberIds.includes(userId);

      default:
        return false;
    }
  }

  getValue(): PostVisibilityType {
    return this.type;
  }

  toString(): string {
    return this.type;
  }

  equals(other: PostVisibility): boolean {
    return this.type === other.type;
  }
}
