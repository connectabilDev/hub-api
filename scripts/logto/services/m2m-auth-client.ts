import { LogtoEnvironmentConfig, M2MToken } from '../types/logto-config';

interface TokenCache {
  token: M2MToken;
  expiresAt: number;
}

export class M2MAuthClient {
  private tokenCache: TokenCache | null = null;
  private readonly bufferTime = 300; // 5 minutes buffer

  constructor(private readonly config: LogtoEnvironmentConfig) {}

  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.tokenCache!.token.access_token;
    }

    const token = await this.requestNewToken();
    this.cacheToken(token);

    return token.access_token;
  }

  private isTokenValid(): boolean {
    if (!this.tokenCache) {
      return false;
    }

    return Date.now() < this.tokenCache.expiresAt - this.bufferTime * 1000;
  }

  private async requestNewToken(): Promise<M2MToken> {
    const tokenUrl = `${this.config.endpoint}/oidc/token`;

    // Try different resource formats
    const possibleResources = [
      `https://default.logto.app/api`, // Default Management API
      `${this.config.endpoint}/api`, // Using endpoint as base
      `https://${this.config.tenantId}.logto.app/api`, // Using tenant ID
    ];

    let lastError: Error | null = null;

    for (const resource of possibleResources) {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.m2mAppId,
        client_secret: this.config.m2mAppSecret,
        resource: resource,
        scope: 'all',
      });

      try {
        console.log(`Trying resource: ${resource}`);

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(
            `Token request failed for resource ${resource}: ${response.status} - ${errorText}`,
          );
          continue;
        }

        const token: M2MToken = await response.json();

        if (!token.access_token) {
          lastError = new Error('Invalid token response: missing access_token');
          continue;
        }

        console.log(`Successfully obtained token with resource: ${resource}`);
        return token;
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error('Failed to obtain M2M token: Unknown error');
        continue;
      }
    }

    throw new Error(
      `Failed to obtain M2M token after trying all resource formats. Last error: ${lastError?.message}`,
    );
  }

  private cacheToken(token: M2MToken): void {
    const expiresAt = Date.now() + token.expires_in * 1000;

    this.tokenCache = {
      token,
      expiresAt,
    };
  }

  clearCache(): void {
    this.tokenCache = null;
  }
}
