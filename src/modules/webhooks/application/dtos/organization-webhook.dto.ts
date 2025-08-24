export class OrganizationWebhookDto {
  event: string;
  createdAt: number;
  data: {
    organizationId: string;
    name?: string;
    description?: string;
    userId?: string;
    role?: string;
    createdAt?: Date;
  };

  static fromWebhookEvent(webhookData: any): OrganizationWebhookDto {
    const dto = new OrganizationWebhookDto();
    dto.event = webhookData.event;
    dto.createdAt = webhookData.createdAt || Date.now();
    dto.data = {
      organizationId:
        webhookData.data?.organizationId || webhookData.organizationId,
      name: webhookData.data?.name || webhookData.name,
      description: webhookData.data?.description || webhookData.description,
      userId: webhookData.data?.userId || webhookData.userId,
      role: webhookData.data?.role || webhookData.role,
      createdAt: webhookData.data?.createdAt || webhookData.createdAt,
    };
    return dto;
  }
}
