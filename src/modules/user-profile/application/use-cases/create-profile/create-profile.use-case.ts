import { Injectable, Inject } from '@nestjs/common';
import { UserProfile } from '../../../domain/entities/user-profile.entity';
import type { UserProfileRepository } from '../../../domain/repositories/user-profile.repository.interface';
import { CreateProfileDto } from '../../dtos/create-profile.dto';

@Injectable()
export class CreateProfileUseCase {
  constructor(
    @Inject('USER_PROFILE_REPOSITORY')
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(dto: CreateProfileDto): Promise<UserProfile> {
    const existingProfile = await this.userProfileRepository.findByLogtoUserId(
      dto.logtoUserId,
    );

    if (existingProfile) {
      throw new Error(`Profile already exists for user: ${dto.logtoUserId}`);
    }

    const profile = UserProfile.create(dto.logtoUserId, dto.fullName);

    return this.userProfileRepository.save(profile);
  }
}
