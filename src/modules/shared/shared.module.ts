import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { OrganizationAwareRepository } from './infrastructure/database/organization-aware.repository';
import { OrganizationContextInterceptor } from './infrastructure/interceptors/organization-context.interceptor';

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
  providers: [OrganizationContextInterceptor],
  exports: [
    DatabaseModule,
    QueueModule,
    OrganizationAwareRepository,
    OrganizationContextInterceptor,
  ],
})
export class SharedModule {}
