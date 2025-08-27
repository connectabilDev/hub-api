import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUrl,
  IsPositive,
} from 'class-validator';
import { MediaType } from '../../domain/value-objects/media-attachment.vo';

export class MediaDto {
  @ApiProperty({
    description: 'The URL of the media file',
    example: 'https://example.com/media/image.jpg',
  })
  @IsString()
  @IsUrl()
  url: string;

  @ApiProperty({
    enum: MediaType,
    description: 'The type of media',
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({
    description: 'The size of the media file in bytes',
    example: 1024000,
  })
  @IsNumber()
  @IsPositive()
  size: number;

  @ApiProperty({
    description: 'The MIME type of the media',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'The thumbnail URL for the media',
    required: false,
    example: 'https://example.com/thumbnails/image-thumb.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'The original filename of the media',
    required: false,
    example: 'my-photo.jpg',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  constructor(data: Partial<MediaDto>) {
    Object.assign(this, data);
  }
}
