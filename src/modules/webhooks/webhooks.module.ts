import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogtoWebhookController } from './infrastructure/controllers/logto-webhook.controller';
import { ProcessLogtoUserEventUseCase } from './application/use-cases/process-logto-user-event/process-logto-user-event.use-case';
import { WebhookSignatureValidator } from './infrastructure/validators/webhook-signature.validator';
import { UsersModule } from '../users/users.module';
import { UserProfileModule } from '../user-profile/user-profile.module';

@Module({
  imports: [ConfigModule, UsersModule, UserProfileModule],
  controllers: [LogtoWebhookController],
  providers: [ProcessLogtoUserEventUseCase, WebhookSignatureValidator],
  exports: [ProcessLogtoUserEventUseCase],
})
export class WebhooksModule {}
