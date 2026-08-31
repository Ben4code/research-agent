import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';
import { AuthService } from './auth.service';
import type { SessionUser } from './session-user';

interface AuthenticatedRequest {
  headers: IncomingHttpHeaders;
  user?: SessionUser;
  session?: unknown;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = toWebHeaders(request.headers);

    const session = await this.authService.auth.api.getSession({ headers });

    if (!session?.user) {
      throw new UnauthorizedException('Not authenticated');
    }

    request.user = session.user;
    request.session = session.session;
    return true;
  }
}

function toWebHeaders(headers: IncomingHttpHeaders): Headers {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) webHeaders.append(key, item);
    } else {
      webHeaders.set(key, String(value));
    }
  }
  return webHeaders;
}
