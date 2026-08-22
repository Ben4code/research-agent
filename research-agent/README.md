# Research Agent

AI-powered research platform that allows users to submit complex research questions and receive structured, source-backed reports. Built with durable workflow execution via Temporal + Mastra.

## Tech Stack

| Layer        | Technology                     |
| ------------ | ------------------------------ |
| Frontend     | Next.js (App Router) + Tailwind + shadcn/ui |
| API          | NestJS                         |
| Worker       | Temporal (TypeScript SDK)      |
| AI Agent     | Mastra                         |
| Database     | PostgreSQL + Prisma ORM        |
| Testing      | Vitest                         |
| Monorepo     | pnpm workspaces                |

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- Docker + Docker Compose

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure (PostgreSQL + Temporal)

```bash
pnpm db:up
```

This starts:

- PostgreSQL (app database) on port `5434`
- Temporal Server on port `7233`
- Temporal UI on port `8233` (http://localhost:8233)
- Temporal's own PostgreSQL on port `5433`

### 3. Set up environment variables

Copy the example env files in each app:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start all services in development

```bash
pnpm dev
```

Or start individually:

```bash
pnpm dev:web     # Next.js on http://localhost:3000
pnpm dev:api     # NestJS on http://localhost:3001
pnpm dev:worker  # Temporal Worker
```

## Monorepo Structure

```
research-agent/
├── apps/
│   ├── web/        # Next.js frontend
│   ├── api/        # NestJS API
│   └── worker/     # Temporal Worker (workflows + activities)
├── packages/
│   └── shared/     # Shared types, enums, DTOs
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Architecture

> **Mastra decides what to do. Temporal makes sure it gets done reliably.**

See `PRD.md` and `Plan.md` in the parent directory for the full product requirements and implementation plan.

## Useful Commands

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Start all apps in parallel           |
| `pnpm build`         | Build all apps                       |
| `pnpm lint`          | Lint all apps                        |
| `pnpm typecheck`     | Type-check all apps                  |
| `pnpm test`          | Run tests across all apps            |
| `pnpm db:up`         | Start PostgreSQL + Temporal          |
| `pnpm db:down`       | Stop infrastructure                  |
| `pnpm db:migrate`    | Run Prisma migrations                |
| `pnpm db:studio`     | Open Prisma Studio                   |
| `pnpm format`        | Format all files with Prettier       |
