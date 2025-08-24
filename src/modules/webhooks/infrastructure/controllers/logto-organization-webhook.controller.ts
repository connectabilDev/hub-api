import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ProcessOrganizationEventUseCase } from '../../application/use-cases/process-organization-event/process-organization-event.use-case';
import { WebhookSignatureValidator } from '../validators/webhook-signature.validator';
import { OrganizationWebhookDto } from '../../application/dtos/organization-webhook.dto';
import {
  WebhookSignatureInvalidError,
  UnsupportedWebhookEventError,
  WebhookEventProcessingError,
} from '../../domain/errors/webhook.errors';

@ApiTags('Webhooks')
@Controller('api/webhooks/logto')
export class LogtoOrganizationWebhookController {
  constructor(
    private readonly processOrganizationEventUseCase: ProcessOrganizationEventUseCase,
    private readonly signatureValidator: WebhookSignatureValidator,
  ) {}

  @Post('organization-events')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  handleOrganizationWebhook(
    @Req() req: any,
    @Headers('logto-signature-sha-256') signature: string,
    @Headers('logto-timestamp') timestamp: string,
    @Body() webhookData: any,
  ): { success: boolean; message: string } {
    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestException('Request body is required');
      }

      const payload = rawBody.toString('utf8');

      this.signatureValidator.validateSignature(payload, signature, timestamp);

      const webhookEvent = OrganizationWebhookDto.fromWebhookEvent(webhookData);

      this.processOrganizationEventUseCase.execute(webhookEvent);

      return {
        success: true,
        message: 'Organization webhook processed successfully',
      };
    } catch (error) {
      if (error instanceof WebhookSignatureInvalidError) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      if (error instanceof UnsupportedWebhookEventError) {
        return {
          success: true,
          message: `Unsupported event type: ${error.message}`,
        };
      }

      if (error instanceof WebhookEventProcessingError) {
        throw new InternalServerErrorException(error.message);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to process webhook');
    }
  }
}
