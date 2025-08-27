import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsInt,
  Length,
  Matches,
  Min,
  Max,
  ArrayMaxSize,
  IsObject,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender } from '../../domain/entities/user-profile.entity';
import { SUPPORTED_COUNTRIES } from '../../domain/value-objects/nationality.vo';
import { DocumentType } from '../../domain/value-objects/identity-document.vo';

export class InternationalAddressDto {
  @ApiPropertyOptional({
    description: 'Primary address line',
    example: '123 Main Street',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Secondary address line (apartment, suite, etc)',
    example: 'Apt 4B',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State or Province',
    example: 'NY',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  stateOrProvince?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '10001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country code',
    enum: Object.keys(SUPPORTED_COUNTRIES),
    example: 'US',
  })
  @IsOptional()
  @IsIn(Object.keys(SUPPORTED_COUNTRIES))
  countryCode?: string;
}

export class IdentityDocumentDto {
  @ApiPropertyOptional({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.PASSPORT,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    description: 'Document value/number',
    example: 'AB123456',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  value?: string;

  @ApiPropertyOptional({
    description: 'Issuing authority',
    example: 'US Government',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  issuedBy?: string;

  @ApiPropertyOptional({
    description: 'Issue date',
    example: '2020-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @ApiPropertyOptional({
    description: 'Expiry date',
    example: '2030-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class UpdateInternationalProfileDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Nationality country code',
    enum: Object.keys(SUPPORTED_COUNTRIES),
    example: 'US',
  })
  @IsOptional()
  @IsIn(Object.keys(SUPPORTED_COUNTRIES))
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Country of residence code',
    enum: Object.keys(SUPPORTED_COUNTRIES),
    example: 'US',
  })
  @IsOptional()
  @IsIn(Object.keys(SUPPORTED_COUNTRIES))
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'International phone number (E.164 format or with country)',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  internationalPhone?: string;

  @ApiPropertyOptional({
    description: 'International address',
    type: InternationalAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InternationalAddressDto)
  internationalAddress?: InternationalAddressDto;

  @ApiPropertyOptional({
    description: 'Identity documents',
    type: [IdentityDocumentDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityDocumentDto)
  identityDocuments?: IdentityDocumentDto[];

  @ApiPropertyOptional({
    description: 'Brazilian CPF document (for Brazilian nationals)',
    example: '123.456.789-00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
    message: 'CPF must be in format XXX.XXX.XXX-XX or XXXXXXXXXXX',
  })
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Brazilian RG document (for Brazilian nationals)',
    example: '12.345.678-9',
  })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  rg?: string;

  @ApiPropertyOptional({
    description: 'Birth date in ISO format',
    example: '1990-05-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Gender identification',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Phone number (legacy field for Brazilian format)',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Professional bio or description',
    example: 'Experienced software engineer with focus on backend development',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Professional headline',
    example: 'Senior Software Engineer | Node.js Specialist',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  headline?: string;

  @ApiPropertyOptional({
    description: 'Professional license number',
    example: 'LIC-123456',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  crcNumber?: string;

  @ApiPropertyOptional({
    description: 'Professional specializations',
    example: ['Backend Development', 'API Design', 'Database Architecture'],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  specializations?: string[];

  @ApiPropertyOptional({
    description: 'Years of professional experience',
    example: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  yearsExperience?: number;

  @ApiPropertyOptional({
    description: 'Locale preferences',
    example: {
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
    },
  })
  @IsOptional()
  @IsObject()
  localePreferences?: Record<string, any>;
}
