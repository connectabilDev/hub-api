import { CPF } from '../value-objects/cpf.vo';
import { RG } from '../value-objects/rg.vo';
import { Phone } from '../value-objects/phone.vo';
import { BirthDate } from '../value-objects/birth-date.vo';
import { Address } from '../value-objects/address.vo';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum OnboardingStep {
  PERSONAL_INFO = 'personal_info',
  DOCUMENTS = 'documents',
  PROFESSIONAL_INFO = 'professional_info',
  COMPLETED = 'completed',
}

export interface UserProfileData {
  id?: string;
  logtoUserId: string;
  fullName: string;
  cpf?: CPF;
  rg?: RG;
  birthDate?: BirthDate;
  gender?: Gender;
  phone?: Phone;
  whatsapp?: Phone;
  bio?: string;
  headline?: string;
  address?: Address;
  crcNumber?: string;
  specializations?: string[];
  yearsExperience?: number;
  profileCompleted?: boolean;
  onboardingStep?: OnboardingStep;
  verificationStatus?: VerificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserProfile {
  private profileCompleted: boolean;
  private onboardingStep: OnboardingStep;
  private verificationStatus: VerificationStatus;

  constructor(private readonly data: UserProfileData) {
    this.validateRequiredFields();
    this.profileCompleted = data.profileCompleted ?? false;
    this.onboardingStep = data.onboardingStep ?? OnboardingStep.PERSONAL_INFO;
    this.verificationStatus =
      data.verificationStatus ?? VerificationStatus.PENDING;
  }

  private validateRequiredFields(): void {
    if (!this.data.logtoUserId || this.data.logtoUserId.trim().length === 0) {
      throw new Error('Logto User ID is required');
    }

    if (!this.data.fullName || this.data.fullName.trim().length === 0) {
      throw new Error('Full name is required');
    }
  }

  static create(logtoUserId: string, fullName: string): UserProfile {
    return new UserProfile({
      id: crypto.randomUUID(),
      logtoUserId,
      fullName,
      profileCompleted: false,
      onboardingStep: OnboardingStep.PERSONAL_INFO,
      verificationStatus: VerificationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(data: UserProfileData): UserProfile {
    return new UserProfile({
      ...data,
      cpf: data.cpf ? new CPF(data.cpf.toString()) : undefined,
      rg: data.rg ? new RG(data.rg.toString()) : undefined,
      birthDate: data.birthDate
        ? new BirthDate(
            data.birthDate instanceof Date
              ? data.birthDate
              : new Date(data.birthDate as any),
          )
        : undefined,
      phone: data.phone ? new Phone(data.phone.toString()) : undefined,
      whatsapp: data.whatsapp ? new Phone(data.whatsapp.toString()) : undefined,
      address: data.address
        ? new Address(
            typeof data.address === 'object'
              ? data.address
              : JSON.parse(data.address as any),
          )
        : undefined,
    });
  }

  updatePersonalInfo(data: {
    fullName?: string;
    cpf?: string;
    rg?: string;
    birthDate?: Date;
    gender?: Gender;
    phone?: string;
    whatsapp?: string;
  }): void {
    if (data.fullName) {
      this.data.fullName = data.fullName;
    }

    if (data.cpf) {
      this.data.cpf = new CPF(data.cpf);
    }

    if (data.rg) {
      this.data.rg = new RG(data.rg);
    }

    if (data.birthDate) {
      this.data.birthDate = new BirthDate(data.birthDate);
    }

    if (data.gender) {
      this.data.gender = data.gender;
    }

    if (data.phone) {
      this.data.phone = new Phone(data.phone);
    }

    if (data.whatsapp) {
      this.data.whatsapp = new Phone(data.whatsapp);
    }

    this.data.updatedAt = new Date();
  }

  updateAddress(address: Address): void {
    this.data.address = address;
    this.data.updatedAt = new Date();
  }

  updateProfessionalInfo(data: {
    bio?: string;
    headline?: string;
    crcNumber?: string;
    specializations?: string[];
    yearsExperience?: number;
  }): void {
    if (data.bio !== undefined) {
      this.data.bio = data.bio;
    }

    if (data.headline !== undefined) {
      this.data.headline = data.headline;
    }

    if (data.crcNumber !== undefined) {
      this.data.crcNumber = data.crcNumber;
    }

    if (data.specializations !== undefined) {
      this.data.specializations = data.specializations;
    }

    if (data.yearsExperience !== undefined) {
      this.data.yearsExperience = data.yearsExperience;
    }

    this.data.updatedAt = new Date();
  }

  advanceOnboardingStep(): void {
    const steps = Object.values(OnboardingStep);
    const currentIndex = steps.indexOf(this.onboardingStep);

    if (currentIndex < steps.length - 1) {
      this.onboardingStep = steps[currentIndex + 1];
      this.data.updatedAt = new Date();
    }
  }

  completeOnboarding(): void {
    this.onboardingStep = OnboardingStep.COMPLETED;
    this.profileCompleted = true;
    this.data.updatedAt = new Date();
  }

  updateVerificationStatus(status: VerificationStatus): void {
    this.verificationStatus = status;
    this.data.updatedAt = new Date();
  }

  isProfileComplete(): boolean {
    return this.profileCompleted;
  }

  getMissingRequiredFields(): string[] {
    const missing: string[] = [];

    if (!this.data.fullName) missing.push('fullName');
    if (!this.data.cpf) missing.push('cpf');
    if (!this.data.rg) missing.push('rg');
    if (!this.data.birthDate) missing.push('birthDate');
    if (!this.data.phone) missing.push('phone');

    return missing;
  }

  getId(): string | undefined {
    return this.data.id;
  }

  getLogtoUserId(): string {
    return this.data.logtoUserId;
  }

  getFullName(): string {
    return this.data.fullName;
  }

  getCpf(): CPF | undefined {
    return this.data.cpf;
  }

  getRg(): RG | undefined {
    return this.data.rg;
  }

  getBirthDate(): BirthDate | undefined {
    return this.data.birthDate;
  }

  getGender(): Gender | undefined {
    return this.data.gender;
  }

  getPhone(): Phone | undefined {
    return this.data.phone;
  }

  getWhatsapp(): Phone | undefined {
    return this.data.whatsapp;
  }

  getBio(): string | undefined {
    return this.data.bio;
  }

  getHeadline(): string | undefined {
    return this.data.headline;
  }

  getAddress(): Address | undefined {
    return this.data.address;
  }

  getCrcNumber(): string | undefined {
    return this.data.crcNumber;
  }

  getSpecializations(): string[] | undefined {
    return this.data.specializations;
  }

  getYearsExperience(): number | undefined {
    return this.data.yearsExperience;
  }

  getOnboardingStep(): OnboardingStep {
    return this.onboardingStep;
  }

  getVerificationStatus(): VerificationStatus {
    return this.verificationStatus;
  }

  getCreatedAt(): Date | undefined {
    return this.data.createdAt;
  }

  getUpdatedAt(): Date | undefined {
    return this.data.updatedAt;
  }
}
