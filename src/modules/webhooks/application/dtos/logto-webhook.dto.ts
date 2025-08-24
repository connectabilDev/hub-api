import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WebhookEvent } from '../../domain/entities/webhook-event.entity';

export class LogtoWebhookDto {
  @IsString()
  @IsNotEmpty()
  hookId: string;

  @IsString()
  @IsNotEmpty()
  event: string;

  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => WebhookEventDataDto)
  data: WebhookEventDataDto;

  static fromWebhookEvent(event: WebhookEvent): LogtoWebhookDto {
    const dto = new LogtoWebhookDto();
    dto.hookId = event.hookId;
    dto.event = event.event;
    dto.createdAt = event.createdAt;
    dto.sessionId = event.sessionId;
    dto.userAgent = event.userAgent;
    dto.ip = event.ip;
    dto.data = WebhookEventDataDto.fromEventData(event.data);
    return dto;
  }
}

export class WebhookEventDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  primaryEmail?: string;

  @IsString()
  @IsOptional()
  primaryPhone?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsObject()
  @IsOptional()
  customData?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @IsString()
  @IsNotEmpty()
  updatedAt: string;

  @IsObject()
  @IsOptional()
  profile?: Record<string, any>;

  static fromEventData(data: any): WebhookEventDataDto {
    const dto = new WebhookEventDataDto();
    dto.id = data.id;
    dto.username = data.username;
    dto.primaryEmail = data.primaryEmail;
    dto.primaryPhone = data.primaryPhone;
    dto.name = data.name;
    dto.avatar = data.avatar;
    dto.customData = data.customData;
    dto.createdAt = data.createdAt;
    dto.updatedAt = data.updatedAt;
    dto.profile = data.profile;
    return dto;
  }
}
