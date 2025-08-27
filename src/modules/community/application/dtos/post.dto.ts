import { ApiProperty } from '@nestjs/swagger';
import { PostVisibility } from '../../domain/entities/post.entity';
import { MediaDto } from './media.dto';

export class PostDto {
  @ApiProperty({
    description: 'Unique identifier for the post',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user who created the post',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'The content of the post',
    example: 'This is an amazing post about technology!',
  })
  content: string;

  @ApiProperty({
    enum: PostVisibility,
    description: 'The visibility level of the post',
    example: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @ApiProperty({
    type: [MediaDto],
    description: 'Media attachments for the post',
  })
  media: MediaDto[];

  @ApiProperty({
    type: [String],
    description: 'Tags associated with the post',
    example: ['technology', 'innovation'],
  })
  tags: string[];

  @ApiProperty({
    description: 'Number of likes on the post',
    example: 42,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Number of comments on the post',
    example: 15,
  })
  commentsCount: number;

  @ApiProperty({
    description: 'Number of shares of the post',
    example: 8,
  })
  sharesCount: number;

  @ApiProperty({
    description: 'Whether the current user has liked this post',
    example: false,
  })
  isLiked: boolean;

  @ApiProperty({
    description: 'Whether the current user can edit this post',
    example: true,
  })
  canEdit: boolean;

  @ApiProperty({
    description: 'Whether the current user can delete this post',
    example: true,
  })
  canDelete: boolean;

  @ApiProperty({
    description: 'When the post was created',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'When the post was last updated',
    example: '2023-12-01T10:30:00.000Z',
  })
  updatedAt: string;

  constructor(data: Partial<PostDto>) {
    Object.assign(this, data);
  }
}
