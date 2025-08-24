import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  user_id?: string;
  email?: string;
  name?: string;
  picture?: string;
  roles?: string[];
  scope?: string;
  organizations?: string[];
  organization_roles?: string[];
  [key: string]: any;
}

export interface TokenValidationRepository {
  validateToken(token: string): Promise<User>;
  getJwks(): Promise<any>;
}
