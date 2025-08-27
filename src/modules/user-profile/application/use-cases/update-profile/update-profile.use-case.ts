import { Injectable, Inject } from '@nestjs/common';
import { UserProfile } from '../../../domain/entities/user-profile.entity';
import { Address } from '../../../domain/value-objects/address.vo';
import type { UserProfileRepository } from '../../../domain/repositories/user-profile.repository.interface';
import { UpdateProfileDto } from '../../dtos/update-profile.dto';
import { ProfileNotFoundError } from '../../../domain/errors/profile-not-found.error';
import { InvalidCpfError } from '../../../domain/errors/invalid-cpf.error';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject('USER_PROFILE_REPOSITORY')
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  async execute(
    profileId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findById(profileId);

    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }

    if (dto.cpf) {
      const existingProfile = await this.userProfileRepository.findByCpf(
        dto.cpf,
      );
      if (existingProfile && existingProfile.getId() !== profileId) {
        throw new InvalidCpfError(dto.cpf);
      }
    }

    if (
      dto.fullName ||
      dto.cpf ||
      dto.rg ||
      dto.birthDate ||
      dto.gender ||
      dto.phone ||
      dto.whatsapp
    ) {
      profile.updatePersonalInfo({
        fullName: dto.fullName,
        cpf: dto.cpf,
        rg: dto.rg,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
      });
    }

    if (dto.address) {
      const address = new Address({
        cep: dto.address.cep,
        street: dto.address.street,
        number: dto.address.number,
        complement: dto.address.complement,
        neighborhood: dto.address.neighborhood,
        city: dto.address.city,
        state: dto.address.state,
        country: dto.address.country,
      });
      profile.updateAddress(address);
    }

    if (
      dto.bio !== undefined ||
      dto.headline !== undefined ||
      dto.crcNumber !== undefined ||
      dto.specializations !== undefined ||
      dto.yearsExperience !== undefined
    ) {
      profile.updateProfessionalInfo({
        bio: dto.bio,
        headline: dto.headline,
        crcNumber: dto.crcNumber,
        specializations: dto.specializations,
        yearsExperience: dto.yearsExperience,
      });
    }

    return this.userProfileRepository.update(profile);
  }

  async executeByLogtoUserId(
    logtoUserId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const profile =
      await this.userProfileRepository.findByLogtoUserId(logtoUserId);

    if (!profile) {
      throw new ProfileNotFoundError(`Logto User ID: ${logtoUserId}`);
    }

    return this.execute(profile.getId()!, dto);
  }
}
