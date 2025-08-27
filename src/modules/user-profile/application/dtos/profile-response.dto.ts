import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Gender,
  OnboardingStep,
  VerificationStatus,
} from '../../domain/entities/user-profile.entity';

export class AddressResponseDto {
  @ApiProperty({ example: '01310-100' })
  cep: string;

  @ApiProperty({ example: 'Avenida Paulista' })
  street: string;

  @ApiPropertyOptional({ example: '1578' })
  number?: string;

  @ApiPropertyOptional({ example: 'Apartamento 102' })
  complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @ApiProperty({ example: 'SP' })
  state: string;

  @ApiProperty({ example: 'Brasil' })
  country: string;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 'prof_123456' })
  id: string;

  @ApiProperty({ example: 'logto_user_123456' })
  logtoUserId: string;

  @ApiProperty({ example: 'João Silva Santos' })
  fullName: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  cpf?: string;

  @ApiPropertyOptional({ example: '12.345.678-9' })
  rg?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  gender?: Gender;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  phone?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  whatsapp?: string;

  @ApiPropertyOptional({
    example: 'Experienced software engineer with focus on backend development',
  })
  bio?: string;

  @ApiPropertyOptional({
    example: 'Senior Software Engineer | Node.js Specialist',
  })
  headline?: string;

  @ApiPropertyOptional({ type: AddressResponseDto })
  address?: AddressResponseDto;

  @ApiPropertyOptional({ example: 'CRC-123456' })
  crcNumber?: string;

  @ApiPropertyOptional({
    example: ['Backend Development', 'API Design', 'Database Architecture'],
    type: [String],
  })
  specializations?: string[];

  @ApiPropertyOptional({ example: 5 })
  yearsExperience?: number;

  @ApiProperty({ example: true })
  profileCompleted: boolean;

  @ApiProperty({ enum: OnboardingStep, example: OnboardingStep.COMPLETED })
  onboardingStep: OnboardingStep;

  @ApiProperty({
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T15:45:00Z' })
  updatedAt: string;
}
