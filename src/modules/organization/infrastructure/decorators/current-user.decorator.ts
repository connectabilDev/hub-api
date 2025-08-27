import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  sub: string;
  email?: string;
  name?: string;
}

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext): CurrentUserData | string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return {
      id: user.id || user.sub,
      sub: user.sub,
      email: user.email,
      name: user.name,
    };
  },
);
