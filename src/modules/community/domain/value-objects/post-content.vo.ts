export class PostContent {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 5000;
  private readonly content: string;
  private readonly sanitized: string;

  private constructor(content: string) {
    this.content = content;
    this.sanitized = this.sanitizeContent(content);
  }

  static create(content: string): PostContent {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    const trimmed = content.trim();

    if (trimmed.length < PostContent.MIN_LENGTH) {
      throw new Error(
        `Content must be at least ${PostContent.MIN_LENGTH} characters`,
      );
    }

    if (trimmed.length > PostContent.MAX_LENGTH) {
      throw new Error(
        `Content must not exceed ${PostContent.MAX_LENGTH} characters`,
      );
    }

    return new PostContent(trimmed);
  }

  getValue(): string {
    return this.content;
  }

  getLength(): number {
    return this.content.length;
  }

  isEmpty(): boolean {
    return this.content.length === 0;
  }

  getSanitized(): string {
    return this.sanitized;
  }

  equals(other: PostContent): boolean {
    return this.content === other.content;
  }

  private sanitizeContent(content: string): string {
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/<form[^>]*>.*?<\/form>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .trim();
  }
}
