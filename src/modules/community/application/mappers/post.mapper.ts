import { Injectable } from '@nestjs/common';
import { Post } from '../../domain/entities/post.entity';
import { PostDto } from '../dtos/post.dto';
import { MediaDto } from '../dtos/media.dto';

@Injectable()
export class PostMapper {
  toDto(entity: Post, currentUserId?: string): PostDto {
    const mediaDto = entity.media.map(
      (media) =>
        new MediaDto({
          url: media.url,
          type: media.type as any,
          size: media.size,
          mimeType: media.type,
          thumbnailUrl: media.thumbnailUrl,
          fileName: media.filename,
        }),
    );

    return new PostDto({
      id: entity.id,
      userId: entity.userId,
      content: entity.content,
      visibility: entity.visibility,
      media: mediaDto,
      tags: entity.tags,
      likesCount: entity.likesCount,
      commentsCount: entity.commentsCount,
      sharesCount: entity.sharesCount,
      isLiked: currentUserId ? entity.isLikedBy(currentUserId) : false,
      canEdit: currentUserId ? entity.canEdit(currentUserId) : false,
      canDelete: currentUserId ? entity.canDelete(currentUserId) : false,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    });
  }

  toDtoList(entities: Post[], currentUserId?: string): PostDto[] {
    return entities.map((entity) => this.toDto(entity, currentUserId));
  }
}
