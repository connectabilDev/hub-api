import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ValidateTokenUseCase } from '../../application/use-cases/validate-token/validate-token.use-case';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly validateTokenUseCase: ValidateTokenUseCase) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || authHeader.trim() === '') {
      return next();
    }

    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    try {
      const user = await this.validateTokenUseCase.execute({ token });
      req.user = user;
    } catch {
      // Silently ignore auth errors in middleware
      // Let the guard handle authentication requirements
    }

    next();
  }
}
