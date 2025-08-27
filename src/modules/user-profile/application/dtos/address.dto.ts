import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({
    description: 'Brazilian postal code (CEP)',
    example: '01310-100',
    pattern: '^\\d{5}-?\\d{3}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}-?\d{3}$/, {
    message: 'CEP must be in format XXXXX-XXX or XXXXXXXX',
  })
  cep: string;

  @ApiProperty({
    description: 'Street name',
    example: 'Avenida Paulista',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  street: string;

  @ApiPropertyOptional({
    description: 'Street number',
    example: '1578',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  number?: string;

  @ApiPropertyOptional({
    description: 'Apartment, suite, or additional address information',
    example: 'Apartamento 102',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  complement?: string;

  @ApiProperty({
    description: 'Neighborhood',
    example: 'Bela Vista',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  neighborhood: string;

  @ApiProperty({
    description: 'City name',
    example: 'São Paulo',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'SP',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  state: string;

  @ApiProperty({
    description: 'Country',
    example: 'Brasil',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  country: string;
}
