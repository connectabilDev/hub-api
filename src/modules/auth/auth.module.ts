import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ValidateTokenUseCase } from './application/use-cases/validate-token/validate-token.use-case';
import { LogtoTokenValidationService } from './infrastructure/providers/logto-token-validation.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { AuthDemoController } from './infrastructure/controllers/auth-demo.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AuthDemoController],
  providers: [
    ValidateTokenUseCase,
    JwtAuthGuard,
    {
      provide: 'TOKEN_VALIDATION_REPOSITORY',
      useClass: LogtoTokenValidationService,
    },
  ],
  exports: [ValidateTokenUseCase, JwtAuthGuard],
})
export class AuthModule {}
