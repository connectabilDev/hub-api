import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { ValidateTokenUseCase } from './application/use-cases/validate-token/validate-token.use-case';
import { LogtoTokenValidationService } from './infrastructure/providers/logto-token-validation.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              LOGTO_DOMAIN: 'https://logto.example.com',
              LOGTO_API_RESOURCE_INDICATOR: 'api-resource',
            }),
          ],
        }),
        AuthModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ValidateTokenUseCase', () => {
    const useCase = module.get<ValidateTokenUseCase>(ValidateTokenUseCase);
    expect(useCase).toBeDefined();
    expect(useCase).toBeInstanceOf(ValidateTokenUseCase);
  });

  it('should provide LogtoTokenValidationService as TOKEN_VALIDATION_REPOSITORY', () => {
    const service = module.get('TOKEN_VALIDATION_REPOSITORY');
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(LogtoTokenValidationService);
  });

  it('should provide JwtAuthGuard', () => {
    const guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should export ValidateTokenUseCase', async () => {
    const exportedModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              LOGTO_DOMAIN: 'https://logto.example.com',
              LOGTO_API_RESOURCE_INDICATOR: 'api-resource',
            }),
          ],
        }),
        AuthModule,
      ],
    }).compile();

    const useCase =
      exportedModule.get<ValidateTokenUseCase>(ValidateTokenUseCase);
    expect(useCase).toBeDefined();

    await exportedModule.close();
  });

  it('should export JwtAuthGuard', async () => {
    const exportedModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              LOGTO_DOMAIN: 'https://logto.example.com',
              LOGTO_API_RESOURCE_INDICATOR: 'api-resource',
            }),
          ],
        }),
        AuthModule,
      ],
    }).compile();

    const guard = exportedModule.get<JwtAuthGuard>(JwtAuthGuard);
    expect(guard).toBeDefined();

    await exportedModule.close();
  });
});
