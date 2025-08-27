import { Injectable, Inject } from '@nestjs/common';
import type { UserProfileRepository } from '../../../domain/repositories/user-profile.repository.interface';

export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class ValidateDocumentsUseCase {
  constructor(
    @Inject('USER_PROFILE_REPOSITORY')
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async validateCpfUniqueness(
    cpf: string,
    excludeProfileId?: string,
  ): Promise<DocumentValidationResult> {
    const existingProfile = await this.userProfileRepository.findByCpf(cpf);

    if (existingProfile && existingProfile.getId() !== excludeProfileId) {
      return {
        isValid: false,
        errors: ['CPF is already registered by another user'],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  async validateAllDocuments(
    cpf: string,
    rg?: string,
    excludeProfileId?: string,
  ): Promise<DocumentValidationResult> {
    const errors: string[] = [];

    const cpfValidation = await this.validateCpfUniqueness(
      cpf,
      excludeProfileId,
    );
    if (!cpfValidation.isValid) {
      errors.push(...cpfValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
