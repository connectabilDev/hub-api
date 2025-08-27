export enum GroupPrivacyType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}

export class GroupPrivacy {
  private readonly type: GroupPrivacyType;

  private constructor(type: GroupPrivacyType) {
    this.type = type;
  }

  static fromString(value: string): GroupPrivacy {
    const upperValue = value.toUpperCase();

    if (!this.isValid(upperValue)) {
      throw new Error(`Invalid group privacy: ${value}`);
    }

    return new GroupPrivacy(upperValue as GroupPrivacyType);
  }

  static isValid(value: string): boolean {
    return Object.values(GroupPrivacyType).includes(value as GroupPrivacyType);
  }

  static createPublic(): GroupPrivacy {
    return new GroupPrivacy(GroupPrivacyType.PUBLIC);
  }

  static createPrivate(): GroupPrivacy {
    return new GroupPrivacy(GroupPrivacyType.PRIVATE);
  }

  static createSecret(): GroupPrivacy {
    return new GroupPrivacy(GroupPrivacyType.SECRET);
  }

  isPublic(): boolean {
    return this.type === GroupPrivacyType.PUBLIC;
  }

  isPrivate(): boolean {
    return this.type === GroupPrivacyType.PRIVATE;
  }

  isSecret(): boolean {
    return this.type === GroupPrivacyType.SECRET;
  }

  canDiscoverGroup(): boolean {
    return this.type === GroupPrivacyType.PUBLIC;
  }

  canRequestToJoin(): boolean {
    return (
      this.type === GroupPrivacyType.PUBLIC ||
      this.type === GroupPrivacyType.PRIVATE
    );
  }

  canViewBasicInfo(): boolean {
    return this.type !== GroupPrivacyType.SECRET;
  }

  canViewContent(isMember: boolean): boolean {
    if (this.type === GroupPrivacyType.PUBLIC) {
      return true;
    }
    return isMember;
  }

  getValue(): GroupPrivacyType {
    return this.type;
  }

  toString(): string {
    return this.type;
  }

  equals(other: GroupPrivacy): boolean {
    return this.type === other.type;
  }
}
