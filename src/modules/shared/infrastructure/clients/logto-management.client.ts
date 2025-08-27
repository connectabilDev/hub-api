import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface OrganizationUser {
  id: string;
  username?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  name?: string;
  avatar?: string;
}

interface OrganizationRole {
  id: string;
  name: string;
  description?: string;
}

interface OrganizationInvitation {
  id: string;
  invitee: string;
  inviter?: string;
  organizationId: string;
  status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  organizationRoles?: OrganizationRole[];
}

interface ListOrganizationsParams {
  page?: number;
  pageSize?: number;
  q?: string;
}

@Injectable()
export class LogtoManagementClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('LOGTO_ENDPOINT', '');
  }

  private async ensureToken(): Promise<void> {
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt > new Date()
    ) {
      return;
    }

    await this.getM2MToken();
  }

  private async getM2MToken(): Promise<void> {
    const tokenUrl = `${this.baseUrl}/oidc/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.configService.get<string>('LOGTO_M2M_APP_ID', ''),
        client_secret: this.configService.get<string>(
          'LOGTO_M2M_APP_SECRET',
          '',
        ),
        resource: `${this.baseUrl}/api`,
        scope: 'all',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get M2M token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;

    const expiresIn = data.expires_in || 3600;
    this.tokenExpiresAt = new Date(Date.now() + (expiresIn - 60) * 1000);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    await this.ensureToken();

    const url = `${this.baseUrl}/api${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `Logto API error: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || responseText;
      } catch {
        errorMessage = responseText || response.statusText;
      }
      throw new Error(errorMessage);
    }

    if (!responseText) {
      return {} as T;
    }

    return JSON.parse(responseText) as T;
  }

  readonly organizations = {
    create: async (data: CreateOrganizationRequest): Promise<Organization> => {
      return this.request<Organization>('POST', '/organizations', data);
    },

    get: async (id: string): Promise<Organization> => {
      return this.request<Organization>('GET', `/organizations/${id}`);
    },

    update: async (
      id: string,
      data: UpdateOrganizationRequest,
    ): Promise<Organization> => {
      return this.request<Organization>('PATCH', `/organizations/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
      await this.request<void>('DELETE', `/organizations/${id}`);
    },

    list: async (params?: ListOrganizationsParams): Promise<Organization[]> => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize)
        queryParams.append('page_size', params.pageSize.toString());
      if (params?.q) queryParams.append('q', params.q);

      const queryString = queryParams.toString();
      const path = queryString
        ? `/organizations?${queryString}`
        : '/organizations';
      return this.request<Organization[]>('GET', path);
    },

    getUsers: async (
      orgId: string,
      page?: number,
      pageSize?: number,
    ): Promise<OrganizationUser[]> => {
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page.toString());
      if (pageSize) queryParams.append('page_size', pageSize.toString());

      const queryString = queryParams.toString();
      const path = queryString
        ? `/organizations/${orgId}/users?${queryString}`
        : `/organizations/${orgId}/users`;
      return this.request<OrganizationUser[]>('GET', path);
    },

    addUsers: async (orgId: string, userIds: string[]): Promise<void> => {
      await this.request('POST', `/organizations/${orgId}/users`, { userIds });
    },

    removeUser: async (orgId: string, userId: string): Promise<void> => {
      await this.request('DELETE', `/organizations/${orgId}/users/${userId}`);
    },

    getUserRoles: async (
      orgId: string,
      userId: string,
    ): Promise<OrganizationRole[]> => {
      return this.request<OrganizationRole[]>(
        'GET',
        `/organizations/${orgId}/users/${userId}/roles`,
      );
    },

    assignUserRoles: async (
      orgId: string,
      userId: string,
      roleNames: string[],
    ): Promise<void> => {
      for (const roleName of roleNames) {
        await this.request(
          'POST',
          `/organizations/${orgId}/users/${userId}/roles`,
          { organizationRoleIds: [roleName] },
        );
      }
    },

    removeUserRole: async (
      orgId: string,
      userId: string,
      roleId: string,
    ): Promise<void> => {
      await this.request(
        'DELETE',
        `/organizations/${orgId}/users/${userId}/roles/${roleId}`,
      );
    },

    createInvitation: async (
      orgId: string,
      inviteeEmail: string,
      roleIds?: string[],
      message?: string,
    ): Promise<OrganizationInvitation> => {
      return this.request<OrganizationInvitation>(
        'POST',
        `/organization-invitations`,
        {
          organizationId: orgId,
          invitee: inviteeEmail,
          organizationRoleIds: roleIds,
          messagePayload: message ? { message } : undefined,
        },
      );
    },

    getInvitations: async (
      orgId: string,
    ): Promise<OrganizationInvitation[]> => {
      return this.request<OrganizationInvitation[]>(
        'GET',
        `/organization-invitations?organizationId=${orgId}`,
      );
    },

    getInvitation: async (
      invitationId: string,
    ): Promise<OrganizationInvitation> => {
      return this.request<OrganizationInvitation>(
        'GET',
        `/organization-invitations/${invitationId}`,
      );
    },

    cancelInvitation: async (invitationId: string): Promise<void> => {
      await this.request('DELETE', `/organization-invitations/${invitationId}`);
    },

    updateInvitationStatus: async (
      invitationId: string,
      status: 'Accepted' | 'Expired' | 'Revoked',
    ): Promise<OrganizationInvitation> => {
      return this.request<OrganizationInvitation>(
        'PUT',
        `/organization-invitations/${invitationId}/status`,
        { status },
      );
    },

    getUserOrganizations: async (userId: string): Promise<Organization[]> => {
      return this.request<Organization[]>(
        'GET',
        `/users/${userId}/organizations`,
      );
    },
  };

  readonly users = {
    get: async (id: string): Promise<any> => {
      return this.request('GET', `/users/${id}`);
    },

    getOrganizations: async (userId: string): Promise<Organization[]> => {
      return this.request<Organization[]>(
        'GET',
        `/users/${userId}/organizations`,
      );
    },
  };
}
