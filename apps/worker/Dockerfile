# syntax=docker/dockerfile:1
# Build context = repo root. Dockerfile path = apps/worker/Dockerfile
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ---- deps: install all workspace deps from lockfile ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# ---- build: shared, prisma client, then worker ----
FROM deps AS build
COPY . .
RUN pnpm --filter @research-agent/shared build
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm --filter @research-agent/api run prisma:generate
RUN pnpm --filter @research-agent/worker build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/worker/dist ./apps/worker/dist

WORKDIR /app/apps/worker
CMD ["node", "dist/worker.js"]