import { Injectable } from '@nestjs/common';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { Address } from '../../domain/value-objects/address.vo';
import {
  ProfileResponseDto,
  AddressResponseDto,
} from '../dtos/profile-response.dto';

@Injectable()
export class UserProfileMapper {
  toDto(profile: UserProfile): ProfileResponseDto {
    const address = profile.getAddress();

    return {
      id: profile.getId()!,
      logtoUserId: profile.getLogtoUserId(),
      fullName: profile.getFullName(),
      cpf: profile.getCpf()?.getFormattedValue(),
      rg: profile.getRg()?.getValue(),
      birthDate: profile.getBirthDate()?.toString(),
      gender: profile.getGender(),
      phone: profile.getPhone()?.getFormattedValue(),
      whatsapp: profile.getWhatsapp()?.getFormattedValue(),
      bio: profile.getBio(),
      headline: profile.getHeadline(),
      address: address ? this.mapAddress(address) : undefined,
      crcNumber: profile.getCrcNumber(),
      specializations: profile.getSpecializations(),
      yearsExperience: profile.getYearsExperience(),
      profileCompleted: profile.isProfileComplete(),
      onboardingStep: profile.getOnboardingStep(),
      verificationStatus: profile.getVerificationStatus(),
      createdAt: profile.getCreatedAt()?.toISOString() || '',
      updatedAt: profile.getUpdatedAt()?.toISOString() || '',
    };
  }

  private mapAddress(address: Address): AddressResponseDto {
    return {
      cep: address.getFormattedCep(),
      street: address.getStreet(),
      number: address.getNumber(),
      complement: address.getComplement(),
      neighborhood: address.getNeighborhood(),
      city: address.getCity(),
      state: address.getState(),
      country: address.getCountry(),
    };
  }
}
