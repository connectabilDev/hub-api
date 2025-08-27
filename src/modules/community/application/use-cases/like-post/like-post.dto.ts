import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class LikePostDto {
  @ApiProperty({
    description: 'The ID of the post to like/unlike',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @ApiProperty({
    description: 'ID of the user liking the post (set by auth middleware)',
    required: false,
  })
  userId?: string;

  constructor(data: Partial<LikePostDto>) {
    Object.assign(this, data);
  }
}

export class LikePostResponseDto {
  @ApiProperty({
    description: 'Whether the post is now liked by the user',
    example: true,
  })
  isLiked: boolean;

  @ApiProperty({
    description: 'Updated likes count for the post',
    example: 42,
  })
  likesCount: number;

  @ApiProperty({
    description: 'The ID of the post',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  postId: string;

  constructor(data: Partial<LikePostResponseDto>) {
    Object.assign(this, data);
  }
}
