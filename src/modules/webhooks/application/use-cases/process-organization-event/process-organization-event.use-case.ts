import { Injectable, Logger } from '@nestjs/common';
import { OrganizationWebhookDto } from '../../dtos/organization-webhook.dto';

@Injectable()
export class ProcessOrganizationEventUseCase {
  private readonly logger = new Logger(ProcessOrganizationEventUseCase.name);

  execute(webhookEvent: OrganizationWebhookDto): void {
    this.logger.log(
      `Processing organization webhook event: ${webhookEvent.event}`,
    );

    switch (webhookEvent.event) {
      case 'organization.created':
        this.handleOrganizationCreated(webhookEvent);
        break;
      case 'organization.member.added':
        this.handleMemberAdded(webhookEvent);
        break;
      case 'organization.member.removed':
        this.handleMemberRemoved(webhookEvent);
        break;
      case 'organization.member.updated':
        this.handleMemberUpdated(webhookEvent);
        break;
      default:
        this.logger.warn(`Unhandled organization event: ${webhookEvent.event}`);
    }
  }

  private handleOrganizationCreated(
    webhookEvent: OrganizationWebhookDto,
  ): void {
    const { organizationId, name } = webhookEvent.data;

    this.logger.log(
      `Organization created: ${organizationId} - ${name || 'Unknown'}`,
    );

    if (!name) {
      this.logger.warn(`Organization ${organizationId} created without a name`);
      return;
    }

    this.logger.log(
      `Organization ${organizationId} created with name: ${name}`,
    );
  }

  private handleMemberAdded(webhookEvent: OrganizationWebhookDto): void {
    const { organizationId, userId, role } = webhookEvent.data;

    this.logger.log(
      `Member added to organization ${organizationId}: User ${userId} with role ${role}`,
    );
  }

  private handleMemberRemoved(webhookEvent: OrganizationWebhookDto): void {
    const { organizationId, userId } = webhookEvent.data;

    this.logger.log(
      `Member removed from organization ${organizationId}: User ${userId}`,
    );
  }

  private handleMemberUpdated(webhookEvent: OrganizationWebhookDto): void {
    const { organizationId, userId, role } = webhookEvent.data;

    this.logger.log(
      `Member updated in organization ${organizationId}: User ${userId} now has role ${role}`,
    );
  }
}
