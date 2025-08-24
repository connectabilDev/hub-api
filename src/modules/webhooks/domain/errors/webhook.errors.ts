export class WebhookSignatureInvalidError extends Error {
  constructor() {
    super('Invalid webhook signature');
    this.name = 'WebhookSignatureInvalidError';
  }
}

export class WebhookEventProcessingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(`Failed to process webhook event: ${message}`);
    this.name = 'WebhookEventProcessingError';
  }
}

export class UnsupportedWebhookEventError extends Error {
  constructor(eventType: string) {
    super(`Unsupported webhook event type: ${eventType}`);
    this.name = 'UnsupportedWebhookEventError';
  }
}
