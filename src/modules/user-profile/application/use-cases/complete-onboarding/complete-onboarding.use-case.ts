import { Injectable, Inject } from '@nestjs/common';
import { UserProfile } from '../../../domain/entities/user-profile.entity';
import type { UserProfileRepository } from '../../../domain/repositories/user-profile.repository.interface';
import { ProfileNotFoundError } from '../../../domain/errors/profile-not-found.error';
import { ProfileIncompleteError } from '../../../domain/errors/profile-incomplete.error';

@Injectable()
export class CompleteOnboardingUseCase {
  constructor(
    @Inject('USER_PROFILE_REPOSITORY')
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(profileId: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findById(profileId);

    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }

    const missingFields = profile.getMissingRequiredFields();
    if (missingFields.length > 0) {
      throw new ProfileIncompleteError(missingFields);
    }

    profile.completeOnboarding();

    return this.userProfileRepository.update(profile);
  }

  async executeByLogtoUserId(logtoUserId: string): Promise<UserProfile> {
    const profile =
      await this.userProfileRepository.findByLogtoUserId(logtoUserId);

    if (!profile) {
      throw new ProfileNotFoundError(`Logto User ID: ${logtoUserId}`);
    }

    return this.execute(profile.getId()!);
  }
}
