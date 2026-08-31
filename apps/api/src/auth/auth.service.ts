import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { createAuth, type Auth } from './auth';

@Injectable()
export class AuthService {
  readonly auth: Auth;

constructor(prisma: PrismaService, config: ConfigService) {
    this.auth = createAuth(prisma, {
      secret:
        config.get<string>('BETTER_AUTH_SECRET') ??
        'dev-secret-change-me-please-32-chars-min',
      baseURL:
        config.get<string>('BETTER_AUTH_URL') ?? 'http://localhost:3001',
      trustedOrigins: [
        config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
      ],
    });
  }
}
