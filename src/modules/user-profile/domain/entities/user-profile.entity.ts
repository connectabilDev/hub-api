import { CPF } from '../value-objects/cpf.vo';
import { RG } from '../value-objects/rg.vo';
import { Phone } from '../value-objects/phone.vo';
import { BirthDate } from '../value-objects/birth-date.vo';
import { Address } from '../value-objects/address.vo';
import { Nationality, CountryCode } from '../value-objects/nationality.vo';
import { InternationalPhone } from '../value-objects/international-phone.vo';
import { InternationalAddress } from '../value-objects/international-address.vo';
import {
  IdentityDocument,
  IdentityDocumentData,
  IdentityDocumentFactory,
} from '../value-objects/identity-document.vo';

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
  nationality?: Nationality;
  countryCode?: CountryCode;
  identityDocuments?: IdentityDocument[];
  internationalPhone?: InternationalPhone;
  internationalAddress?: InternationalAddress;
  localePreferences?: Record<string, any>;
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
    const reconstitutedData: UserProfileData = {
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
    };

    if (data.nationality) {
      reconstitutedData.nationality = new Nationality(
        data.nationality.toString(),
      );
    }

    if (data.internationalPhone) {
      const phoneData =
        typeof data.internationalPhone === 'object'
          ? (data.internationalPhone as any)
          : JSON.parse(data.internationalPhone as string);
      reconstitutedData.internationalPhone = new InternationalPhone(
        phoneData.value || phoneData,
        phoneData.countryCode || (data.countryCode as any),
      );
    }

    if (data.internationalAddress) {
      const addressData =
        typeof data.internationalAddress === 'object'
          ? (data.internationalAddress as any)
          : JSON.parse(data.internationalAddress as string);
      reconstitutedData.internationalAddress = new InternationalAddress(
        addressData,
      );
    }

    if (data.identityDocuments) {
      const docsData =
        typeof data.identityDocuments === 'object'
          ? data.identityDocuments
          : JSON.parse(data.identityDocuments as string);

      reconstitutedData.identityDocuments = Array.isArray(docsData)
        ? docsData.map((doc: IdentityDocumentData) =>
            IdentityDocumentFactory.create(doc),
          )
        : [];
    }

    return new UserProfile(reconstitutedData);
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
    if (!this.data.birthDate) missing.push('birthDate');

    const isBrazilian = this.data.nationality?.isBrazilian() ?? true;

    if (isBrazilian) {
      if (!this.data.cpf) missing.push('cpf');
      if (!this.data.rg) missing.push('rg');
      if (!this.data.phone) missing.push('phone');
    } else {
      if (!this.data.internationalPhone) missing.push('internationalPhone');
      if (
        !this.data.identityDocuments ||
        this.data.identityDocuments.length === 0
      ) {
        missing.push('identityDocuments');
      }
      if (!this.data.internationalAddress) missing.push('internationalAddress');
    }

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

  getNationality(): Nationality | undefined {
    return this.data.nationality;
  }

  getCountryCode(): CountryCode | undefined {
    return this.data.countryCode;
  }

  getIdentityDocuments(): IdentityDocument[] | undefined {
    return this.data.identityDocuments;
  }

  getInternationalPhone(): InternationalPhone | undefined {
    return this.data.internationalPhone;
  }

  getInternationalAddress(): InternationalAddress | undefined {
    return this.data.internationalAddress;
  }

  getLocalePreferences(): Record<string, any> | undefined {
    return this.data.localePreferences;
  }

  updateNationality(nationality: Nationality): void {
    this.data.nationality = nationality;
    this.data.countryCode = nationality.getCode();
    this.data.updatedAt = new Date();
  }

  updateInternationalPhone(phone: InternationalPhone): void {
    this.data.internationalPhone = phone;
    this.data.updatedAt = new Date();
  }

  updateInternationalAddress(address: InternationalAddress): void {
    this.data.internationalAddress = address;
    this.data.updatedAt = new Date();
  }

  addIdentityDocument(document: IdentityDocument): void {
    if (!this.data.identityDocuments) {
      this.data.identityDocuments = [];
    }

    const existingIndex = this.data.identityDocuments.findIndex(
      (doc) => doc.getType().toString() === document.getType().toString(),
    );

    if (existingIndex >= 0) {
      this.data.identityDocuments[existingIndex] = document;
    } else {
      this.data.identityDocuments.push(document);
    }

    this.data.updatedAt = new Date();
  }

  removeIdentityDocument(documentType: string): void {
    if (!this.data.identityDocuments) return;

    this.data.identityDocuments = this.data.identityDocuments.filter(
      (doc) => doc.getType().toString() !== documentType,
    );

    this.data.updatedAt = new Date();
  }

  updateLocalePreferences(preferences: Record<string, any>): void {
    this.data.localePreferences = {
      ...this.data.localePreferences,
      ...preferences,
    };
    this.data.updatedAt = new Date();
  }
}
