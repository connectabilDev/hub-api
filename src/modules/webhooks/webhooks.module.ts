import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogtoWebhookController } from './infrastructure/controllers/logto-webhook.controller';
import { ProcessLogtoUserEventUseCase } from './application/use-cases/process-logto-user-event/process-logto-user-event.use-case';
import { WebhookSignatureValidator } from './infrastructure/validators/webhook-signature.validator';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [LogtoWebhookController],
  providers: [ProcessLogtoUserEventUseCase, WebhookSignatureValidator],
  exports: [ProcessLogtoUserEventUseCase],
})
export class WebhooksModule {}
