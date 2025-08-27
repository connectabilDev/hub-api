import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFeedPostsDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of posts per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'ID of the user requesting the feed (set by auth middleware)',
    required: false,
  })
  userId?: string;

  @ApiProperty({
    description: 'Specific post ID to retrieve (for individual post details)',
    required: false,
  })
  @IsOptional()
  @IsString()
  postId?: string;

  constructor(data: Partial<GetFeedPostsDto>) {
    Object.assign(this, data);
    this.page = this.page ?? 1;
    this.limit = this.limit ?? 20;
    this.sortOrder = this.sortOrder ?? 'desc';
  }
}
