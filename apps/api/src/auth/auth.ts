import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { PrismaClient } from '@prisma/client';

export interface AuthConfig {
  secret: string;
  baseURL: string;
  trustedOrigins?: string[];
}

export function createAuth(prisma: PrismaClient, config: AuthConfig) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          input: false,
          defaultValue: 'user',
        },
      },
    },
    trustedOrigins: config.trustedOrigins,
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: '/api/auth',
  });
}

export type Auth = ReturnType<typeof createAuth>;
