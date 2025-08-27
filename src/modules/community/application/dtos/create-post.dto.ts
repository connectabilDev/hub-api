import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostVisibility } from '../../domain/entities/post.entity';
import { MediaDto } from './media.dto';

export class CreatePostDto {
  @ApiProperty({
    description: 'The content of the post',
    example: 'This is an amazing post about technology!',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    enum: PostVisibility,
    description: 'The visibility level of the post',
    example: PostVisibility.PUBLIC,
    default: PostVisibility.PUBLIC,
  })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility = PostVisibility.PUBLIC;

  @ApiProperty({
    type: [MediaDto],
    description: 'Media attachments for the post',
    required: false,
    example: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media?: MediaDto[];

  @ApiProperty({
    type: [String],
    description: 'Tags associated with the post',
    required: false,
    example: ['technology', 'innovation'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'ID of the user creating the post (set by auth middleware)',
    required: false,
  })
  userId?: string;

  constructor(data: Partial<CreatePostDto>) {
    Object.assign(this, data);
    this.visibility = this.visibility ?? PostVisibility.PUBLIC;
    this.media = this.media ?? [];
    this.tags = this.tags ?? [];
  }
}
