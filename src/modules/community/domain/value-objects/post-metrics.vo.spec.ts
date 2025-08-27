import { PostMetrics, MetricType } from './post-metrics.vo';

describe('PostMetrics', () => {
  describe('create', () => {
    it('should create with valid metrics', () => {
      const metrics = PostMetrics.create(10, 5, 2);
      expect(metrics.getLikes()).toBe(10);
      expect(metrics.getComments()).toBe(5);
      expect(metrics.getShares()).toBe(2);
    });

    it('should create with default values', () => {
      const metrics = PostMetrics.create();
      expect(metrics.getLikes()).toBe(0);
      expect(metrics.getComments()).toBe(0);
      expect(metrics.getShares()).toBe(0);
    });

    it('should throw error for negative values', () => {
      expect(() => PostMetrics.create(-1, 0, 0)).toThrow(
        'likes must be a non-negative integer',
      );
      expect(() => PostMetrics.create(0, -1, 0)).toThrow(
        'comments must be a non-negative integer',
      );
      expect(() => PostMetrics.create(0, 0, -1)).toThrow(
        'shares must be a non-negative integer',
      );
    });

    it('should throw error for non-integer values', () => {
      expect(() => PostMetrics.create(1.5, 0, 0)).toThrow(
        'likes must be a non-negative integer',
      );
      expect(() => PostMetrics.create(0, 2.7, 0)).toThrow(
        'comments must be a non-negative integer',
      );
    });
  });

  describe('createEmpty', () => {
    it('should create empty metrics', () => {
      const metrics = PostMetrics.createEmpty();
      expect(metrics.getLikes()).toBe(0);
      expect(metrics.getComments()).toBe(0);
      expect(metrics.getShares()).toBe(0);
    });
  });

  describe('increment', () => {
    it('should increment likes correctly', () => {
      const metrics = PostMetrics.create(5, 3, 2);
      const updated = metrics.increment(MetricType.LIKES);

      expect(updated.getLikes()).toBe(6);
      expect(updated.getComments()).toBe(3);
      expect(updated.getShares()).toBe(2);
      expect(metrics.getLikes()).toBe(5); // Original unchanged
    });

    it('should increment comments correctly', () => {
      const metrics = PostMetrics.create(5, 3, 2);
      const updated = metrics.increment(MetricType.COMMENTS);

      expect(updated.getLikes()).toBe(5);
      expect(updated.getComments()).toBe(4);
      expect(updated.getShares()).toBe(2);
    });

    it('should increment shares correctly', () => {
      const metrics = PostMetrics.create(5, 3, 2);
      const updated = metrics.increment(MetricType.SHARES);

      expect(updated.getLikes()).toBe(5);
      expect(updated.getComments()).toBe(3);
      expect(updated.getShares()).toBe(3);
    });

    it('should throw error for invalid metric type', () => {
      const metrics = PostMetrics.create(5, 3, 2);
      expect(() => metrics.increment('invalid' as MetricType)).toThrow(
        'Invalid metric type: invalid',
      );
    });
  });

  describe('decrement', () => {
    it('should decrement likes correctly', () => {
      const metrics = PostMetrics.create(5, 3, 2);
      const updated = metrics.decrement(MetricType.LIKES);

      expect(updated.getLikes()).toBe(4);
      expect(updated.getComments()).toBe(3);
      expect(updated.getShares()).toBe(2);
    });

    it('should not go below zero', () => {
      const metrics = PostMetrics.create(0, 1, 2);
      const updated = metrics.decrement(MetricType.LIKES);

      expect(updated.getLikes()).toBe(0);
    });

    it('should decrement comments correctly', () => {
      const metrics = PostMetrics.create(5, 3, 2);
      const updated = metrics.decrement(MetricType.COMMENTS);

      expect(updated.getComments()).toBe(2);
    });

    it('should decrement shares correctly', () => {
      const metrics = PostMetrics.create(5, 3, 2);
      const updated = metrics.decrement(MetricType.SHARES);

      expect(updated.getShares()).toBe(1);
    });
  });

  describe('engagement calculations', () => {
    it('should calculate total engagement correctly', () => {
      const metrics = PostMetrics.create(10, 5, 2);
      expect(metrics.getTotalEngagement()).toBe(17);
    });

    it('should calculate engagement score with weights', () => {
      const metrics = PostMetrics.create(10, 5, 2);
      // likes(10)*1 + comments(5)*3 + shares(2)*5 = 10 + 15 + 10 = 35
      expect(metrics.getEngagementScore()).toBe(35);
    });

    it('should identify if has engagement', () => {
      const emptyMetrics = PostMetrics.createEmpty();
      expect(emptyMetrics.hasEngagement()).toBe(false);

      const activeMetrics = PostMetrics.create(1, 0, 0);
      expect(activeMetrics.hasEngagement()).toBe(true);
    });

    it('should identify most engagement type', () => {
      const likesWin = PostMetrics.create(10, 5, 2);
      expect(likesWin.getMostEngagementType()).toBe(MetricType.LIKES);

      const commentsWin = PostMetrics.create(2, 10, 5);
      expect(commentsWin.getMostEngagementType()).toBe(MetricType.COMMENTS);

      const sharesWin = PostMetrics.create(2, 5, 10);
      expect(sharesWin.getMostEngagementType()).toBe(MetricType.SHARES);

      const empty = PostMetrics.createEmpty();
      expect(empty.getMostEngagementType()).toBeNull();
    });
  });

  describe('getMetricValue', () => {
    it('should return correct values for each metric type', () => {
      const metrics = PostMetrics.create(10, 5, 2);

      expect(metrics.getMetricValue(MetricType.LIKES)).toBe(10);
      expect(metrics.getMetricValue(MetricType.COMMENTS)).toBe(5);
      expect(metrics.getMetricValue(MetricType.SHARES)).toBe(2);
    });

    it('should throw error for invalid metric type', () => {
      const metrics = PostMetrics.create(10, 5, 2);
      expect(() => metrics.getMetricValue('invalid' as MetricType)).toThrow(
        'Invalid metric type: invalid',
      );
    });
  });

  describe('equals', () => {
    it('should return true for same metrics', () => {
      const metrics1 = PostMetrics.create(10, 5, 2);
      const metrics2 = PostMetrics.create(10, 5, 2);
      expect(metrics1.equals(metrics2)).toBe(true);
    });

    it('should return false for different metrics', () => {
      const metrics1 = PostMetrics.create(10, 5, 2);
      const metrics2 = PostMetrics.create(10, 5, 3);
      expect(metrics1.equals(metrics2)).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should return object representation', () => {
      const metrics = PostMetrics.create(10, 5, 2);
      const obj = metrics.toObject();

      expect(obj).toEqual({
        likes: 10,
        comments: 5,
        shares: 2,
      });
    });
  });

  describe('immutability', () => {
    it('should not modify original metrics when incrementing', () => {
      const original = PostMetrics.create(5, 3, 2);
      const incremented = original.increment(MetricType.LIKES);

      expect(original.getLikes()).toBe(5);
      expect(incremented.getLikes()).toBe(6);
    });

    it('should not modify original metrics when decrementing', () => {
      const original = PostMetrics.create(5, 3, 2);
      const decremented = original.decrement(MetricType.LIKES);

      expect(original.getLikes()).toBe(5);
      expect(decremented.getLikes()).toBe(4);
    });
  });
});
