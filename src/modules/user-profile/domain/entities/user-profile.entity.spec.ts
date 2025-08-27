import {
  UserProfile,
  Gender,
  OnboardingStep,
  VerificationStatus,
} from './user-profile.entity';
import { Address } from '../value-objects/address.vo';
import { CPF } from '../value-objects/cpf.vo';

describe('UserProfile Entity', () => {
  const validCpfString = '12345678909';
  const validCpf = new CPF(validCpfString);
  const logtoUserId = 'logto_user_123';
  const fullName = 'João Silva Santos';

  describe('Creation', () => {
    it('should create user profile with required fields', () => {
      const profile = UserProfile.create(logtoUserId, fullName);

      expect(profile.getLogtoUserId()).toBe(logtoUserId);
      expect(profile.getFullName()).toBe(fullName);
      expect(profile.isProfileComplete()).toBe(false);
      expect(profile.getOnboardingStep()).toBe(OnboardingStep.PERSONAL_INFO);
      expect(profile.getVerificationStatus()).toBe(VerificationStatus.PENDING);
    });

    it('should throw error for empty logto user id', () => {
      expect(() => UserProfile.create('', fullName)).toThrow(
        'Logto User ID is required',
      );
    });

    it('should throw error for empty full name', () => {
      expect(() => UserProfile.create(logtoUserId, '')).toThrow(
        'Full name is required',
      );
    });
  });

  describe('Personal Info Updates', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create(logtoUserId, fullName);
    });

    it('should update personal info', () => {
      const birthDate = new Date('1990-05-15');

      profile.updatePersonalInfo({
        fullName: 'João Silva Santos Jr',
        cpf: validCpfString,
        birthDate,
        gender: Gender.MALE,
        phone: '11999999999',
      });

      expect(profile.getFullName()).toBe('João Silva Santos Jr');
      expect(profile.getCpf()?.getCleanValue()).toBe(validCpfString);
      expect(profile.getBirthDate()?.getValue()).toEqual(birthDate);
      expect(profile.getGender()).toBe(Gender.MALE);
      expect(profile.getPhone()?.getCleanValue()).toBe('11999999999');
    });

    it('should update only provided fields', () => {
      const originalName = profile.getFullName();

      profile.updatePersonalInfo({
        phone: '11999999999',
      });

      expect(profile.getFullName()).toBe(originalName);
      expect(profile.getPhone()?.getCleanValue()).toBe('11999999999');
    });
  });

  describe('Professional Info Updates', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create(logtoUserId, fullName);
    });

    it('should update professional info', () => {
      profile.updateProfessionalInfo({
        bio: 'Software Engineer',
        headline: 'Senior Developer',
        crcNumber: 'CRC-123456',
        specializations: ['Backend', 'API'],
        yearsExperience: 5,
      });

      expect(profile.getBio()).toBe('Software Engineer');
      expect(profile.getHeadline()).toBe('Senior Developer');
      expect(profile.getCrcNumber()).toBe('CRC-123456');
      expect(profile.getSpecializations()).toEqual(['Backend', 'API']);
      expect(profile.getYearsExperience()).toBe(5);
    });
  });

  describe('Address Updates', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create(logtoUserId, fullName);
    });

    it('should update address', () => {
      const address = new Address({
        cep: '01310100',
        street: 'Avenida Paulista',
        number: '1578',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
      });

      profile.updateAddress(address);

      expect(profile.getAddress()?.getCep()).toBe('01310100');
      expect(profile.getAddress()?.getStreet()).toBe('Avenida Paulista');
    });
  });

  describe('Onboarding', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create(logtoUserId, fullName);
    });

    it('should advance onboarding step', () => {
      expect(profile.getOnboardingStep()).toBe(OnboardingStep.PERSONAL_INFO);

      profile.advanceOnboardingStep();
      expect(profile.getOnboardingStep()).toBe(OnboardingStep.DOCUMENTS);
    });

    it('should complete onboarding', () => {
      profile.completeOnboarding();

      expect(profile.getOnboardingStep()).toBe(OnboardingStep.COMPLETED);
      expect(profile.isProfileComplete()).toBe(true);
    });

    it('should not advance beyond completed step', () => {
      profile.completeOnboarding();
      profile.advanceOnboardingStep();

      expect(profile.getOnboardingStep()).toBe(OnboardingStep.COMPLETED);
    });
  });

  describe('Missing Fields', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create(logtoUserId, fullName);
    });

    it('should return all missing required fields for new profile', () => {
      const missingFields = profile.getMissingRequiredFields();

      expect(missingFields).toContain('cpf');
      expect(missingFields).toContain('rg');
      expect(missingFields).toContain('birthDate');
      expect(missingFields).toContain('phone');
      expect(missingFields).toHaveLength(4); // fullName is provided
    });

    it('should return fewer missing fields as profile is completed', () => {
      profile.updatePersonalInfo({
        cpf: validCpfString,
        phone: '11999999999',
      });

      const missingFields = profile.getMissingRequiredFields();

      expect(missingFields).not.toContain('cpf');
      expect(missingFields).not.toContain('phone');
      expect(missingFields).toContain('rg');
      expect(missingFields).toContain('birthDate');
    });
  });

  describe('Verification Status', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create(logtoUserId, fullName);
    });

    it('should update verification status', () => {
      profile.updateVerificationStatus(VerificationStatus.VERIFIED);
      expect(profile.getVerificationStatus()).toBe(VerificationStatus.VERIFIED);
    });
  });

  describe('Reconstitution', () => {
    it('should reconstitute profile from data', () => {
      const data = {
        id: 'profile_123',
        logtoUserId,
        fullName,
        cpf: validCpf,
        rg: undefined,
        birthDate: undefined,
        gender: undefined,
        phone: undefined,
        whatsapp: undefined,
        bio: undefined,
        headline: undefined,
        address: undefined,
        crcNumber: undefined,
        specializations: undefined,
        yearsExperience: undefined,
        profileCompleted: true,
        onboardingStep: OnboardingStep.COMPLETED,
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const profile = UserProfile.reconstitute(data);

      expect(profile.getId()).toBe('profile_123');
      expect(profile.getLogtoUserId()).toBe(logtoUserId);
      expect(profile.isProfileComplete()).toBe(true);
    });
  });
});
