export interface UserProps {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  roles?: string[];
  sub: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly name?: string;
  public readonly picture?: string;
  public readonly roles: string[];
  public readonly sub: string;
  public readonly iat: number;
  public readonly exp: number;
  public readonly aud: string;
  public readonly iss: string;

  constructor(props: UserProps) {
    if (!props.id) {
      throw new Error('User ID is required');
    }

    if (!props.email) {
      throw new Error('User email is required');
    }

    if (!props.sub) {
      throw new Error('User sub is required');
    }

    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.picture = props.picture;
    this.roles = props.roles || [];
    this.sub = props.sub;
    this.iat = props.iat;
    this.exp = props.exp;
    this.aud = props.aud;
    this.iss = props.iss;
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  isTokenExpired(): boolean {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return this.exp < currentTimestamp;
  }
}
