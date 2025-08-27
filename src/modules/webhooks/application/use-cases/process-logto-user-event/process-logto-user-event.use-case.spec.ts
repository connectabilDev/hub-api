import { Test, TestingModule } from '@nestjs/testing';
import { ProcessLogtoUserEventUseCase } from './process-logto-user-event.use-case';
import { CreateUserUseCase } from '../../../../users/application/use-cases/create-user/create-user.use-case';
import { CreateProfileUseCase } from '../../../../user-profile/application/use-cases/create-profile/create-profile.use-case';
import { LogtoWebhookDto } from '../../dtos/logto-webhook.dto';
import {
  UnsupportedWebhookEventError,
  WebhookEventProcessingError,
} from '../../../domain/errors/webhook.errors';

describe('ProcessLogtoUserEventUseCase', () => {
  let useCase: ProcessLogtoUserEventUseCase;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let createProfileUseCase: jest.Mocked<CreateProfileUseCase>;

  beforeEach(async () => {
    const mockCreateUserUseCase = {
      execute: jest.fn(),
    };

    const mockCreateProfileUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessLogtoUserEventUseCase,
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: CreateProfileUseCase,
          useValue: mockCreateProfileUseCase,
        },
      ],
    }).compile();

    useCase = module.get<ProcessLogtoUserEventUseCase>(
      ProcessLogtoUserEventUseCase,
    );
    createUserUseCase = module.get(CreateUserUseCase);
    createProfileUseCase = module.get(CreateProfileUseCase);
  });

  describe('execute', () => {
    it('should handle User.Created event', async () => {
      const webhookEvent: LogtoWebhookDto = {
        hookId: 'hook-123',
        event: 'User.Created',
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          id: 'user-123',
          primaryEmail: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };

      await useCase.execute(webhookEvent);

      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        externalId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        avatar: undefined,
        phone: undefined,
      });

      expect(createProfileUseCase.execute).toHaveBeenCalledWith({
        logtoUserId: 'user-123',
        fullName: 'Test User',
      });
    });

    it('should handle User.Data.Updated event', async () => {
      const webhookEvent: LogtoWebhookDto = {
        hookId: 'hook-123',
        event: 'User.Data.Updated',
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          id: 'user-123',
          primaryEmail: 'updated@example.com',
          name: 'Updated User',
          username: 'updateduser',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:01:00.000Z',
        },
      };

      await useCase.execute(webhookEvent);

      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        externalId: 'user-123',
        email: 'updated@example.com',
        name: 'Updated User',
        username: 'updateduser',
        avatar: undefined,
        phone: undefined,
      });

      expect(createProfileUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw UnsupportedWebhookEventError for unknown events', async () => {
      const webhookEvent: LogtoWebhookDto = {
        hookId: 'hook-123',
        event: 'Unknown.Event',
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          id: 'user-123',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };

      await expect(useCase.execute(webhookEvent)).rejects.toThrow(
        UnsupportedWebhookEventError,
      );
    });

    it('should throw WebhookEventProcessingError when createUserUseCase fails', async () => {
      createUserUseCase.execute.mockRejectedValue(new Error('Database error'));

      const webhookEvent: LogtoWebhookDto = {
        hookId: 'hook-123',
        event: 'User.Created',
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          id: 'user-123',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };

      await expect(useCase.execute(webhookEvent)).rejects.toThrow(
        WebhookEventProcessingError,
      );
    });

    it('should build name from profile when name is not provided', async () => {
      const webhookEvent: LogtoWebhookDto = {
        hookId: 'hook-123',
        event: 'User.Created',
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          id: 'user-123',
          primaryEmail: 'test@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          profile: {
            givenName: 'John',
            familyName: 'Doe',
          },
        },
      };

      await useCase.execute(webhookEvent);

      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        externalId: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        username: undefined,
        avatar: undefined,
        phone: undefined,
      });

      expect(createProfileUseCase.execute).toHaveBeenCalledWith({
        logtoUserId: 'user-123',
        fullName: 'John Doe',
      });
    });
  });
});
