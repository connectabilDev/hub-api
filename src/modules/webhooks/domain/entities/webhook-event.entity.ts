export interface WebhookEvent {
  hookId: string;
  event: string;
  createdAt: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  data: WebhookEventData;
}

export interface WebhookEventData {
  id: string;
  username?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  name?: string;
  avatar?: string;
  customData?: Record<string, any>;
  identities?: WebhookUserIdentity[];
  lastSignInAt?: string;
  createdAt: string;
  updatedAt: string;
  profile?: WebhookUserProfile;
  applicationId?: string;
  isSuspended: boolean;
}

export interface WebhookUserIdentity {
  userId: string;
  details: Record<string, any>;
}

export interface WebhookUserProfile {
  familyName?: string;
  givenName?: string;
  middleName?: string;
  nickname?: string;
  preferredUsername?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  emailVerified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  address?: {
    formatted?: string;
    streetAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  updatedAt?: string;
}
