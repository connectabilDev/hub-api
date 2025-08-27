import { Injectable } from '@nestjs/common';
import { LogtoWebhookDto } from '../../dtos/logto-webhook.dto';
import { CreateUserUseCase } from '../../../../users/application/use-cases/create-user/create-user.use-case';
import { CreateUserDto } from '../../../../users/application/use-cases/create-user/create-user.dto';
import { CreateProfileUseCase } from '../../../../user-profile/application/use-cases/create-profile/create-profile.use-case';
import {
  UnsupportedWebhookEventError,
  WebhookEventProcessingError,
} from '../../../domain/errors/webhook.errors';

@Injectable()
export class ProcessLogtoUserEventUseCase {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createProfileUseCase: CreateProfileUseCase,
  ) {}

  async execute(webhookEvent: LogtoWebhookDto): Promise<void> {
    try {
      switch (webhookEvent.event) {
        case 'User.Created':
          await this.handleUserCreated(webhookEvent);
          break;
        case 'User.Data.Updated':
          await this.handleUserUpdated(webhookEvent);
          break;
        case 'User.Deleted':
          await this.handleUserDeleted(webhookEvent);
          break;
        default:
          throw new UnsupportedWebhookEventError(webhookEvent.event);
      }
    } catch (error) {
      if (error instanceof UnsupportedWebhookEventError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new WebhookEventProcessingError(
        message,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private async handleUserCreated(
    webhookEvent: LogtoWebhookDto,
  ): Promise<void> {
    const userData = webhookEvent.data;

    const createUserDto: CreateUserDto = {
      externalId: userData.id,
      email: userData.primaryEmail || userData.profile?.email || '',
      name: userData.name || this.buildNameFromProfile(userData.profile),
      username: userData.username,
      avatar: userData.avatar || userData.profile?.picture,
      phone: userData.primaryPhone || userData.profile?.phoneNumber,
    };

    await this.createUserUseCase.execute(createUserDto);

    await this.createProfileUseCase.execute({
      logtoUserId: userData.id,
      fullName: createUserDto.name || 'User',
    });
  }

  private async handleUserUpdated(
    webhookEvent: LogtoWebhookDto,
  ): Promise<void> {
    const userData = webhookEvent.data;

    const updateUserDto: CreateUserDto = {
      externalId: userData.id,
      email: userData.primaryEmail || userData.profile?.email || '',
      name: userData.name || this.buildNameFromProfile(userData.profile),
      username: userData.username,
      avatar: userData.avatar || userData.profile?.picture,
      phone: userData.primaryPhone || userData.profile?.phoneNumber,
    };

    await this.createUserUseCase.execute(updateUserDto);
  }

  private async handleUserDeleted(_: LogtoWebhookDto): Promise<void> {}

  private buildNameFromProfile(profile: any): string | undefined {
    if (!profile) return undefined;

    const { givenName, familyName, nickname, preferredUsername } = profile;

    if (givenName && familyName) {
      return `${givenName} ${familyName}`;
    }

    return nickname || preferredUsername;
  }
}
