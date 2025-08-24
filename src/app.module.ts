import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './modules/shared/shared.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [SharedModule, UsersModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
