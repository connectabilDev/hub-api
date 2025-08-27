import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isDocker = process.cwd() === '/app';

        let i18nPath: string;
        if (isDocker) {
          i18nPath = path.join(process.cwd(), 'dist', 'i18n');
        } else {
          i18nPath = path.join(__dirname, 'i18n');
        }

        console.log('i18n path:', i18nPath);

        return {
          fallbackLanguage: configService.get('DEFAULT_LANGUAGE', 'en'),
          loaderOptions: {
            path: i18nPath,
            watch: configService.get('NODE_ENV') === 'development',
          },
        };
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['x-lang', 'x-locale']),
        AcceptLanguageResolver,
      ],
      inject: [ConfigService],
    }),
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
