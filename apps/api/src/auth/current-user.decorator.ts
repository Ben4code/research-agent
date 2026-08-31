import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { SessionUser } from './session-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser => {
    const request = context.switchToHttp().getRequest<{ user: SessionUser }>();
    return request.user;
  },
);
