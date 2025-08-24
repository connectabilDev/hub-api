import { CreateWebhookRequest } from '../types/logto-config';

export const createWebhookConfigs = (
  backendUrl: string,
): CreateWebhookRequest[] => [
  {
    name: 'User Registration Webhook',
    events: ['User.Created', 'User.Data.Updated', 'User.Deleted'],
    config: {
      url: `${backendUrl}/api/webhooks/logto/user-created`,
    },
    enabled: true,
  },
];
