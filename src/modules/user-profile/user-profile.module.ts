import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';

import { CreateProfileUseCase } from './application/use-cases/create-profile/create-profile.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile/get-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile/update-profile.use-case';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding/complete-onboarding.use-case';
import { ValidateDocumentsUseCase } from './application/use-cases/validate-documents/validate-documents.use-case';

import { UserProfileMapper } from './application/mappers/user-profile.mapper';

import { UserProfileController } from './infrastructure/controllers/user-profile.controller';
import { OnboardingController } from './infrastructure/controllers/onboarding.controller';

import { UserProfileRepositoryImpl } from './infrastructure/repositories/user-profile.repository.impl';
import { CpfValidatorService } from './infrastructure/validators/cpf-validator.service';
import { CepValidatorService } from './infrastructure/services/cep-validator.service';

@Module({
  imports: [SharedModule],
  providers: [
    CreateProfileUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    CompleteOnboardingUseCase,
    ValidateDocumentsUseCase,

    UserProfileMapper,

    {
      provide: 'USER_PROFILE_REPOSITORY',
      useClass: UserProfileRepositoryImpl,
    },

    CpfValidatorService,
    CepValidatorService,
  ],
  controllers: [UserProfileController, OnboardingController],
  exports: [
    CreateProfileUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    CompleteOnboardingUseCase,
    ValidateDocumentsUseCase,
    'USER_PROFILE_REPOSITORY',
  ],
})
export class UserProfileModule {}
