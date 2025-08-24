import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookSignatureInvalidError } from '../../domain/errors/webhook.errors';

@Injectable()
export class WebhookSignatureValidator {
  private readonly signingKey: string;

  constructor(private readonly configService: ConfigService) {
    this.signingKey = this.configService.getOrThrow<string>(
      'LOGTO_WEBHOOK_SIGNING_KEY',
    );
  }

  validateSignature(
    payload: string,
    signature: string,
    timestamp: string,
  ): void {
    if (!signature || !timestamp) {
      throw new WebhookSignatureInvalidError();
    }

    const expectedSignature = this.generateSignature(payload, timestamp);

    if (!this.isValidSignature(signature, expectedSignature)) {
      throw new WebhookSignatureInvalidError();
    }

    if (!this.isValidTimestamp(timestamp)) {
      throw new WebhookSignatureInvalidError();
    }
  }

  private generateSignature(payload: string, timestamp: string): string {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = createHmac('sha256', this.signingKey)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return `v1=${signature}`;
  }

  private isValidSignature(
    receivedSignature: string,
    expectedSignature: string,
  ): boolean {
    try {
      const receivedBuffer = Buffer.from(receivedSignature, 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

      return (
        receivedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(receivedBuffer, expectedBuffer)
      );
    } catch {
      return false;
    }
  }

  private isValidTimestamp(timestamp: string): boolean {
    const webhookTimestamp = parseInt(timestamp, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes

    return Math.abs(currentTimestamp - webhookTimestamp) <= tolerance;
  }
}
