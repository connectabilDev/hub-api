import { Injectable, Inject } from '@nestjs/common';
import { UserProfile } from '../../../domain/entities/user-profile.entity';
import type { UserProfileRepository } from '../../../domain/repositories/user-profile.repository.interface';
import { ProfileNotFoundError } from '../../../domain/errors/profile-not-found.error';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject('USER_PROFILE_REPOSITORY')
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async executeById(id: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findById(id);

    if (!profile) {
      throw new ProfileNotFoundError(id);
    }

    return profile;
  }

  async executeByLogtoUserId(logtoUserId: string): Promise<UserProfile> {
    const profile =
      await this.userProfileRepository.findByLogtoUserId(logtoUserId);

    if (!profile) {
      throw new ProfileNotFoundError(`Logto User ID: ${logtoUserId}`);
    }

    return profile;
  }
}
