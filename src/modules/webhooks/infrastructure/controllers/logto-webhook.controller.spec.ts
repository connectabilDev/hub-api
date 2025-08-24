import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { LogtoWebhookController } from './logto-webhook.controller';
import { ProcessLogtoUserEventUseCase } from '../../application/use-cases/process-logto-user-event/process-logto-user-event.use-case';
import { WebhookSignatureValidator } from '../validators/webhook-signature.validator';
import {
  WebhookSignatureInvalidError,
  UnsupportedWebhookEventError,
  WebhookEventProcessingError,
} from '../../domain/errors/webhook.errors';

describe('LogtoWebhookController', () => {
  let controller: LogtoWebhookController;
  let processLogtoUserEventUseCase: jest.Mocked<ProcessLogtoUserEventUseCase>;
  let signatureValidator: jest.Mocked<WebhookSignatureValidator>;

  beforeEach(async () => {
    const mockProcessLogtoUserEventUseCase = {
      execute: jest.fn(),
    };

    const mockSignatureValidator = {
      validateSignature: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogtoWebhookController],
      providers: [
        {
          provide: ProcessLogtoUserEventUseCase,
          useValue: mockProcessLogtoUserEventUseCase,
        },
        {
          provide: WebhookSignatureValidator,
          useValue: mockSignatureValidator,
        },
      ],
    }).compile();

    controller = module.get<LogtoWebhookController>(LogtoWebhookController);
    processLogtoUserEventUseCase = module.get(ProcessLogtoUserEventUseCase);
    signatureValidator = module.get(WebhookSignatureValidator);
  });

  describe('handleUserWebhook', () => {
    const mockRequest = {
      rawBody: Buffer.from('{"hookId":"hook-123","event":"User.Created"}'),
    } as any;

    const mockWebhookData = {
      hookId: 'hook-123',
      event: 'User.Created',
      createdAt: '2024-01-01T00:00:00.000Z',
      data: {
        id: 'user-123',
        primaryEmail: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    it('should process webhook successfully', async () => {
      signatureValidator.validateSignature.mockReturnValue(undefined);
      processLogtoUserEventUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.handleUserWebhook(
        mockRequest,
        'v1=signature',
        '1641024000',
        mockWebhookData,
      );

      expect(result).toEqual({
        success: true,
        message: 'Webhook processed successfully',
      });
      expect(signatureValidator.validateSignature).toHaveBeenCalled();
      expect(processLogtoUserEventUseCase.execute).toHaveBeenCalled();
    });

    it('should throw BadRequestException when rawBody is missing', async () => {
      const requestWithoutBody = { rawBody: null } as any;

      await expect(
        controller.handleUserWebhook(
          requestWithoutBody,
          'v1=signature',
          '1641024000',
          mockWebhookData,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      signatureValidator.validateSignature.mockImplementation(() => {
        throw new WebhookSignatureInvalidError();
      });

      await expect(
        controller.handleUserWebhook(
          mockRequest,
          'invalid-signature',
          '1641024000',
          mockWebhookData,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return success for unsupported event types', async () => {
      signatureValidator.validateSignature.mockReturnValue(undefined);
      processLogtoUserEventUseCase.execute.mockImplementation(() => {
        throw new UnsupportedWebhookEventError('Unknown.Event');
      });

      const result = await controller.handleUserWebhook(
        mockRequest,
        'v1=signature',
        '1641024000',
        mockWebhookData,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Unsupported event type');
    });

    it('should throw InternalServerErrorException for processing errors', async () => {
      signatureValidator.validateSignature.mockReturnValue(undefined);
      processLogtoUserEventUseCase.execute.mockImplementation(() => {
        throw new WebhookEventProcessingError('Database error');
      });

      await expect(
        controller.handleUserWebhook(
          mockRequest,
          'v1=signature',
          '1641024000',
          mockWebhookData,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
