import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../../domain/entities/user.entity';

@Controller('auth-demo')
@UseGuards(JwtAuthGuard)
export class AuthDemoController {
  @Get('public')
  @Public()
  getPublicData() {
    return {
      message: 'This is public data, accessible without authentication',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('protected')
  getProtectedData(@CurrentUser() user: User) {
    return {
      message: 'This is protected data, requires authentication',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('profile')
  getUserProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      roles: user.roles,
      sub: user.sub,
      tokenInfo: {
        issuedAt: new Date(user.iat * 1000).toISOString(),
        expiresAt: new Date(user.exp * 1000).toISOString(),
        issuer: user.iss,
        audience: user.aud,
      },
    };
  }

  @Get('user-email')
  getUserEmail(@CurrentUser('email') email: string) {
    return {
      email,
      timestamp: new Date().toISOString(),
    };
  }
}
