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
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender } from '../../domain/entities/user-profile.entity';
import { AddressDto } from './address.dto';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'João Silva Santos',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Brazilian CPF document',
    example: '123.456.789-00',
    pattern: '^\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
    message: 'CPF must be in format XXX.XXX.XXX-XX or XXXXXXXXXXX',
  })
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Brazilian RG document',
    example: '12.345.678-9',
    minLength: 5,
    maxLength: 20,
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
    description: 'Phone number',
    example: '(11) 99999-9999',
    pattern: '^\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, {
    message: 'Phone must be a valid Brazilian phone number',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number',
    example: '(11) 99999-9999',
    pattern: '^\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, {
    message: 'WhatsApp must be a valid Brazilian phone number',
  })
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
    description: 'Address information',
    type: AddressDto,
  })
  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'CRC registration number',
    example: 'CRC-123456',
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
}
