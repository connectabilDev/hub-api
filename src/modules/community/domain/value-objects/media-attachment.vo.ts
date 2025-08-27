export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
}

export class MediaAttachment {
  private static readonly MAX_SIZES: Record<MediaType, number> = {
    [MediaType.IMAGE]: 10 * 1024 * 1024, // 10MB
    [MediaType.VIDEO]: 100 * 1024 * 1024, // 100MB
    [MediaType.AUDIO]: 20 * 1024 * 1024, // 20MB
    [MediaType.DOCUMENT]: 50 * 1024 * 1024, // 50MB
  };

  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ];

  private static readonly ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/mp3',
  ];

  private static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  private readonly url: string;
  private readonly type: MediaType;
  private readonly size: number;
  private readonly mimeType: string;
  private readonly thumbnailUrl?: string;
  private readonly fileName?: string;

  private constructor(
    url: string,
    type: MediaType,
    size: number,
    mimeType: string,
    thumbnailUrl?: string,
    fileName?: string,
  ) {
    this.url = url;
    this.type = type;
    this.size = size;
    this.mimeType = mimeType;
    this.thumbnailUrl = thumbnailUrl;
    this.fileName = fileName;
  }

  static create(
    url: string,
    type: string,
    size: number,
    mimeType: string,
    thumbnailUrl?: string,
    fileName?: string,
  ): MediaAttachment {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new Error('URL is required and must be a non-empty string');
    }

    if (!MediaAttachment.isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }

    const mediaType = MediaAttachment.parseMediaType(type);

    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Size must be a positive integer');
    }

    if (!mimeType || typeof mimeType !== 'string') {
      throw new Error('MIME type is required');
    }

    const attachment = new MediaAttachment(
      url.trim(),
      mediaType,
      size,
      mimeType.toLowerCase(),
      thumbnailUrl?.trim(),
      fileName?.trim(),
    );

    if (!attachment.isValid()) {
      throw new Error(
        `Invalid media attachment: ${attachment.getValidationError()}`,
      );
    }

    return attachment;
  }

  private static parseMediaType(type: string): MediaType {
    const upperType = type.toUpperCase();

    if (!Object.values(MediaType).includes(upperType as MediaType)) {
      throw new Error(`Invalid media type: ${type}`);
    }

    return upperType as MediaType;
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isImage(): boolean {
    return this.type === MediaType.IMAGE;
  }

  isVideo(): boolean {
    return this.type === MediaType.VIDEO;
  }

  isAudio(): boolean {
    return this.type === MediaType.AUDIO;
  }

  isDocument(): boolean {
    return this.type === MediaType.DOCUMENT;
  }

  isValid(): boolean {
    return this.validateSize() && this.validateMimeType();
  }

  getValidationError(): string | null {
    if (!this.validateSize()) {
      const maxSize = MediaAttachment.MAX_SIZES[this.type];
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File size ${this.getSizeInMB()}MB exceeds maximum allowed size of ${maxSizeMB}MB for ${this.type}`;
    }

    if (!this.validateMimeType()) {
      return `MIME type ${this.mimeType} is not allowed for ${this.type}`;
    }

    return null;
  }

  getUrl(): string {
    return this.url;
  }

  getType(): MediaType {
    return this.type;
  }

  getSize(): number {
    return this.size;
  }

  getSizeInMB(): string {
    return (this.size / (1024 * 1024)).toFixed(2);
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getThumbnailUrl(): string | undefined {
    return this.thumbnailUrl;
  }

  getFileName(): string | undefined {
    return this.fileName;
  }

  hasThumbnail(): boolean {
    return !!this.thumbnailUrl;
  }

  getMaxAllowedSize(): number {
    return MediaAttachment.MAX_SIZES[this.type];
  }

  getAllowedMimeTypes(): string[] {
    switch (this.type) {
      case MediaType.IMAGE:
        return [...MediaAttachment.ALLOWED_IMAGE_TYPES];
      case MediaType.VIDEO:
        return [...MediaAttachment.ALLOWED_VIDEO_TYPES];
      case MediaType.AUDIO:
        return [...MediaAttachment.ALLOWED_AUDIO_TYPES];
      case MediaType.DOCUMENT:
        return [...MediaAttachment.ALLOWED_DOCUMENT_TYPES];
      default:
        return [];
    }
  }

  equals(other: MediaAttachment): boolean {
    return (
      this.url === other.url &&
      this.type === other.type &&
      this.size === other.size &&
      this.mimeType === other.mimeType &&
      this.thumbnailUrl === other.thumbnailUrl &&
      this.fileName === other.fileName
    );
  }

  toObject(): {
    url: string;
    type: MediaType;
    size: number;
    mimeType: string;
    thumbnailUrl?: string;
    fileName?: string;
  } {
    return {
      url: this.url,
      type: this.type,
      size: this.size,
      mimeType: this.mimeType,
      thumbnailUrl: this.thumbnailUrl,
      fileName: this.fileName,
    };
  }

  private validateSize(): boolean {
    const maxSize = MediaAttachment.MAX_SIZES[this.type];
    return this.size <= maxSize;
  }

  private validateMimeType(): boolean {
    const allowedTypes = this.getAllowedMimeTypes();
    return allowedTypes.includes(this.mimeType);
  }
}
