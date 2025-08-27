import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { OrganizationContextInterceptor } from './infrastructure/interceptors/organization-context.interceptor';
import { I18nTestController } from './infrastructure/controllers/i18n-test.controller';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule.forRoot(),
    QueueModule,
  ],
  controllers: [I18nTestController],
  providers: [OrganizationContextInterceptor],
  exports: [DatabaseModule, QueueModule, OrganizationContextInterceptor],
})
export class SharedModule {}
