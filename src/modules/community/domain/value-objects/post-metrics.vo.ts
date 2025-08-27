export enum MetricType {
  LIKES = 'likes',
  COMMENTS = 'comments',
  SHARES = 'shares',
}

export class PostMetrics {
  private readonly likes: number;
  private readonly comments: number;
  private readonly shares: number;

  private constructor(likes: number, comments: number, shares: number) {
    this.validateMetricValue(likes, 'likes');
    this.validateMetricValue(comments, 'comments');
    this.validateMetricValue(shares, 'shares');

    this.likes = likes;
    this.comments = comments;
    this.shares = shares;
  }

  static create(
    likes: number = 0,
    comments: number = 0,
    shares: number = 0,
  ): PostMetrics {
    return new PostMetrics(likes, comments, shares);
  }

  static createEmpty(): PostMetrics {
    return new PostMetrics(0, 0, 0);
  }

  increment(metric: MetricType): PostMetrics {
    switch (metric) {
      case MetricType.LIKES:
        return new PostMetrics(this.likes + 1, this.comments, this.shares);
      case MetricType.COMMENTS:
        return new PostMetrics(this.likes, this.comments + 1, this.shares);
      case MetricType.SHARES:
        return new PostMetrics(this.likes, this.comments, this.shares + 1);
      default:
        throw new Error(`Invalid metric type: ${metric as string}`);
    }
  }

  decrement(metric: MetricType): PostMetrics {
    switch (metric) {
      case MetricType.LIKES:
        return new PostMetrics(
          Math.max(0, this.likes - 1),
          this.comments,
          this.shares,
        );
      case MetricType.COMMENTS:
        return new PostMetrics(
          this.likes,
          Math.max(0, this.comments - 1),
          this.shares,
        );
      case MetricType.SHARES:
        return new PostMetrics(
          this.likes,
          this.comments,
          Math.max(0, this.shares - 1),
        );
      default:
        throw new Error(`Invalid metric type: ${metric as string}`);
    }
  }

  getLikes(): number {
    return this.likes;
  }

  getComments(): number {
    return this.comments;
  }

  getShares(): number {
    return this.shares;
  }

  getTotalEngagement(): number {
    return this.likes + this.comments + this.shares;
  }

  getEngagementScore(): number {
    const weights = {
      like: 1,
      comment: 3,
      share: 5,
    };

    return (
      this.likes * weights.like +
      this.comments * weights.comment +
      this.shares * weights.share
    );
  }

  hasEngagement(): boolean {
    return this.getTotalEngagement() > 0;
  }

  getMostEngagementType(): MetricType | null {
    const max = Math.max(this.likes, this.comments, this.shares);

    if (max === 0) {
      return null;
    }

    if (this.likes === max) return MetricType.LIKES;
    if (this.comments === max) return MetricType.COMMENTS;
    return MetricType.SHARES;
  }

  getMetricValue(metric: MetricType): number {
    switch (metric) {
      case MetricType.LIKES:
        return this.likes;
      case MetricType.COMMENTS:
        return this.comments;
      case MetricType.SHARES:
        return this.shares;
      default:
        throw new Error(`Invalid metric type: ${metric as string}`);
    }
  }

  equals(other: PostMetrics): boolean {
    return (
      this.likes === other.likes &&
      this.comments === other.comments &&
      this.shares === other.shares
    );
  }

  toObject(): { likes: number; comments: number; shares: number } {
    return {
      likes: this.likes,
      comments: this.comments,
      shares: this.shares,
    };
  }

  private validateMetricValue(value: number, metricName: string): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${metricName} must be a non-negative integer`);
    }
  }
}
