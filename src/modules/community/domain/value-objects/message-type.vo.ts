export enum MessageTypeEnum {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  SYSTEM = 'SYSTEM',
}

export class MessageType {
  private static readonly MAX_SIZES: Record<MessageTypeEnum, number> = {
    [MessageTypeEnum.TEXT]: 0, // No file size limit for text
    [MessageTypeEnum.IMAGE]: 10 * 1024 * 1024, // 10MB
    [MessageTypeEnum.VIDEO]: 100 * 1024 * 1024, // 100MB
    [MessageTypeEnum.DOCUMENT]: 50 * 1024 * 1024, // 50MB
    [MessageTypeEnum.AUDIO]: 20 * 1024 * 1024, // 20MB
    [MessageTypeEnum.SYSTEM]: 0, // No file size limit for system messages
  };

  private static readonly MEDIA_TYPES: MessageTypeEnum[] = [
    MessageTypeEnum.IMAGE,
    MessageTypeEnum.VIDEO,
    MessageTypeEnum.AUDIO,
  ];

  private static readonly URL_REQUIRED_TYPES: MessageTypeEnum[] = [
    MessageTypeEnum.IMAGE,
    MessageTypeEnum.VIDEO,
    MessageTypeEnum.DOCUMENT,
    MessageTypeEnum.AUDIO,
  ];

  private readonly type: MessageTypeEnum;

  private constructor(type: MessageTypeEnum) {
    this.type = type;
  }

  static fromString(value: string): MessageType {
    const upperValue = value.toUpperCase();

    if (!this.isValid(upperValue)) {
      throw new Error(`Invalid message type: ${value}`);
    }

    return new MessageType(upperValue as MessageTypeEnum);
  }

  static isValid(value: string): boolean {
    return Object.values(MessageTypeEnum).includes(value as MessageTypeEnum);
  }

  static createText(): MessageType {
    return new MessageType(MessageTypeEnum.TEXT);
  }

  static createImage(): MessageType {
    return new MessageType(MessageTypeEnum.IMAGE);
  }

  static createVideo(): MessageType {
    return new MessageType(MessageTypeEnum.VIDEO);
  }

  static createDocument(): MessageType {
    return new MessageType(MessageTypeEnum.DOCUMENT);
  }

  static createAudio(): MessageType {
    return new MessageType(MessageTypeEnum.AUDIO);
  }

  static createSystem(): MessageType {
    return new MessageType(MessageTypeEnum.SYSTEM);
  }

  isText(): boolean {
    return this.type === MessageTypeEnum.TEXT;
  }

  isImage(): boolean {
    return this.type === MessageTypeEnum.IMAGE;
  }

  isVideo(): boolean {
    return this.type === MessageTypeEnum.VIDEO;
  }

  isDocument(): boolean {
    return this.type === MessageTypeEnum.DOCUMENT;
  }

  isAudio(): boolean {
    return this.type === MessageTypeEnum.AUDIO;
  }

  isSystem(): boolean {
    return this.type === MessageTypeEnum.SYSTEM;
  }

  isMedia(): boolean {
    return MessageType.MEDIA_TYPES.includes(this.type);
  }

  requiresUrl(): boolean {
    return MessageType.URL_REQUIRED_TYPES.includes(this.type);
  }

  getMaxSize(): number {
    return MessageType.MAX_SIZES[this.type];
  }

  validateFileSize(fileSize: number): boolean {
    if (!this.requiresUrl()) {
      return true;
    }
    return fileSize <= this.getMaxSize();
  }

  getAcceptedMimeTypes(): string[] {
    switch (this.type) {
      case MessageTypeEnum.IMAGE:
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      case MessageTypeEnum.VIDEO:
        return ['video/mp4', 'video/webm', 'video/ogg'];
      case MessageTypeEnum.AUDIO:
        return ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
      case MessageTypeEnum.DOCUMENT:
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
      default:
        return [];
    }
  }

  getValue(): MessageTypeEnum {
    return this.type;
  }

  toString(): string {
    return this.type;
  }

  equals(other: MessageType): boolean {
    return this.type === other.type;
  }
}
