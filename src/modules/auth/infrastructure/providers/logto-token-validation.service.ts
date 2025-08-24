import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import {
  TokenValidationRepository,
  JwtPayload,
} from '../../domain/repositories/token-validation.repository.interface';
import { User } from '../../domain/entities/user.entity';
import {
  InvalidTokenError,
  TokenExpiredError,
  JwksError,
} from '../../domain/errors/auth.errors';

@Injectable()
export class LogtoTokenValidationService implements TokenValidationRepository {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwksUri: string;
  private jwks: any;

  constructor(private readonly configService: ConfigService) {
    const domain = this.configService.get<string>('LOGTO_DOMAIN');
    const apiResourceIndicator = this.configService.get<string>(
      'LOGTO_API_RESOURCE_INDICATOR',
    );

    if (!domain) {
      throw new Error('LOGTO_DOMAIN environment variable is required');
    }

    if (!apiResourceIndicator) {
      throw new Error(
        'LOGTO_API_RESOURCE_INDICATOR environment variable is required',
      );
    }

    this.issuer = `${domain}/oidc`;
    this.audience = apiResourceIndicator;
    this.jwksUri = `${domain}/oidc/jwks`;
  }

  async validateToken(token: string): Promise<User> {
    try {
      const jwks = await this.getJwks();

      const { payload } = await jose.jwtVerify(token, jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['ES384'],
      });

      const jwtPayload = payload as JwtPayload;

      return new User({
        id: jwtPayload.user_id || jwtPayload.sub,
        email: jwtPayload.email || '',
        name: jwtPayload.name,
        picture: jwtPayload.picture,
        roles: jwtPayload.roles || [],
        sub: jwtPayload.sub,
        iat: jwtPayload.iat,
        exp: jwtPayload.exp,
        aud: jwtPayload.aud,
        iss: jwtPayload.iss,
      });
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new TokenExpiredError('Token has expired');
      }

      if (error instanceof jose.errors.JWTInvalid) {
        throw new InvalidTokenError('Token is invalid');
      }

      throw new InvalidTokenError('Token validation failed', error as Error);
    }
  }

  getJwks(): any {
    if (!this.jwks) {
      try {
        this.jwks = jose.createRemoteJWKSet(new URL(this.jwksUri));
      } catch (error) {
        throw new JwksError('Failed to create JWKS', error as Error);
      }
    }

    return this.jwks;
  }
}
