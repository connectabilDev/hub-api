import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import {
  UserProfile as UserProfileDB,
  NewUserProfile,
  UserProfileUpdate,
  Database,
} from '../../../shared/infrastructure/database/database.types';
import type { UserProfileRepository } from '../../domain/repositories/user-profile.repository.interface';
import { BaseRepository } from '../../../shared/infrastructure/database/base.repository';

@Injectable()
export class UserProfileRepositoryImpl
  extends BaseRepository
  implements UserProfileRepository
{
  constructor(db: Kysely<Database>) {
    super(db);
  }

  async save(profile: UserProfile): Promise<UserProfile> {
    const data: NewUserProfile = {
      id: profile.getId(),
      logto_user_id: profile.getLogtoUserId(),
      full_name: profile.getFullName(),
      cpf: profile.getCpf()?.getCleanValue(),
      rg: profile.getRg()?.getCleanValue(),
      birth_date: profile.getBirthDate()?.getValue(),
      gender: profile.getGender(),
      phone: profile.getPhone()?.getCleanValue(),
      whatsapp: profile.getWhatsapp()?.getCleanValue(),
      bio: profile.getBio(),
      headline: profile.getHeadline(),
      address: profile.getAddress()?.toPlainObject(),
      crc_number: profile.getCrcNumber(),
      specializations: profile.getSpecializations(),
      years_experience: profile.getYearsExperience(),
      profile_completed: profile.isProfileComplete(),
      onboarding_step: profile.getOnboardingStep(),
      verification_status: profile.getVerificationStatus(),
      created_at: profile.getCreatedAt(),
      updated_at: profile.getUpdatedAt(),
    };

    const result = await this.db
      .insertInto('user_profiles')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<UserProfile | null> {
    const result = await this.db
      .selectFrom('user_profiles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return result ? this.mapToEntity(result) : null;
  }

  async findByLogtoUserId(logtoUserId: string): Promise<UserProfile | null> {
    const result = await this.db
      .selectFrom('user_profiles')
      .selectAll()
      .where('logto_user_id', '=', logtoUserId)
      .executeTakeFirst();

    return result ? this.mapToEntity(result) : null;
  }

  async findByCpf(cpf: string): Promise<UserProfile | null> {
    const cleanCpf = cpf.replace(/\D/g, '');

    const result = await this.db
      .selectFrom('user_profiles')
      .selectAll()
      .where('cpf', '=', cleanCpf)
      .executeTakeFirst();

    return result ? this.mapToEntity(result) : null;
  }

  async update(profile: UserProfile): Promise<UserProfile> {
    const data: UserProfileUpdate = {
      full_name: profile.getFullName(),
      cpf: profile.getCpf()?.getCleanValue(),
      rg: profile.getRg()?.getCleanValue(),
      birth_date: profile.getBirthDate()?.getValue(),
      gender: profile.getGender(),
      phone: profile.getPhone()?.getCleanValue(),
      whatsapp: profile.getWhatsapp()?.getCleanValue(),
      bio: profile.getBio(),
      headline: profile.getHeadline(),
      address: profile.getAddress()?.toPlainObject(),
      crc_number: profile.getCrcNumber(),
      specializations: profile.getSpecializations(),
      years_experience: profile.getYearsExperience(),
      profile_completed: profile.isProfileComplete(),
      onboarding_step: profile.getOnboardingStep(),
      verification_status: profile.getVerificationStatus(),
      updated_at: this.now(),
    };

    const result = await this.db
      .updateTable('user_profiles')
      .set(data)
      .where('id', '=', profile.getId()!)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('user_profiles').where('id', '=', id).execute();
  }

  async existsById(id: string): Promise<boolean> {
    return this.exists('user_profiles', 'id', id);
  }

  async existsByLogtoUserId(logtoUserId: string): Promise<boolean> {
    return this.exists('user_profiles', 'logto_user_id', logtoUserId);
  }

  async existsByCpf(cpf: string): Promise<boolean> {
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.exists('user_profiles', 'cpf', cleanCpf);
  }

  private mapToEntity(data: UserProfileDB): UserProfile {
    return UserProfile.reconstitute({
      id: data.id,
      logtoUserId: data.logto_user_id,
      fullName: data.full_name,
      cpf: data.cpf,
      rg: data.rg,
      birthDate: data.birth_date,
      gender: data.gender,
      phone: data.phone,
      whatsapp: data.whatsapp,
      bio: data.bio,
      headline: data.headline,
      address: data.address,
      crcNumber: data.crc_number,
      specializations: data.specializations,
      yearsExperience: data.years_experience,
      profileCompleted: data.profile_completed,
      onboardingStep: data.onboarding_step,
      verificationStatus: data.verification_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as any);
  }
}
