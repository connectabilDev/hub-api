import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidateTokenUseCase } from '../../application/use-cases/validate-token/validate-token.use-case';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../domain/errors/auth.errors';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly validateTokenUseCase: ValidateTokenUseCase,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || authHeader.trim() === '') {
      throw new UnauthorizedException('Missing authorization header');
    }

    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    try {
      const user = await this.validateTokenUseCase.execute({ token });
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw new UnauthorizedException('Invalid token');
      }

      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
