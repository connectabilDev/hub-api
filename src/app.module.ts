import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './modules/shared/shared.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './health/health.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CommunityModule } from './modules/community/community.module';
import { UserProfileModule } from './modules/user-profile/user-profile.module';

@Module({
  imports: [
    SharedModule,
    UsersModule,
    AuthModule,
    HealthModule,
    WebhooksModule,
    CommunityModule,
    UserProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
