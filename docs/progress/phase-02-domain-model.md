# Phase 2 — Domain Model

**Status:** ✅ Complete
**Milestone:** M1 — Infrastructure
**Started:** 2026-08-22
**Completed:** 2026-08-22

## Goals

Create the application's core data model.

## Tables

- [x] `users`
- [x] `research`
- [x] `sources`
- [x] `findings`
- [x] `reports`

## Tasks

- [x] Choose ORM — Prisma 5
- [x] Create database schema (`prisma/schema.prisma`)
- [x] Add migrations (`20260822044653_init`)
- [x] Create Research entity
- [x] Create Source entity
- [x] Create Finding entity
- [x] Create Report entity
- [x] Add repository/data-access layer (`PrismaService`, `PrismaModule`)
- [x] Add seed data (`prisma/seed.ts`)

## Decisions

- **ORM:** Prisma 5 (not TypeORM) — better DX, type-safe queries, migration system
- **Seed user ID:** Fixed to `demo-user-id` to match the controller's hardcoded demo user
- **Seed data:** 4 research projects (2 completed, 1 researching, 1 failed) with sources, findings, and reports
- **Shared types:** `ResearchStatus` enum in `@research-agent/shared` duplicated as Prisma `String` field for flexibility

## Seed Data Summary

| # | Question                                      | Status      | Sources | Findings | Report |
|---|-----------------------------------------------|-------------|---------|----------|--------|
| 1 | Payment processors for Canadian SaaS          | completed   | 3       | 3        | Yes    |
| 2 | Temporal vs BullMQ vs Inngest                 | completed   | 3       | 0        | Yes    |
| 3 | React state management 2026                   | researching | 0       | 0        | No     |
| 4 | Canadian AI regulations                       | failed      | 0       | 0        | No     |

## Verification

- [x] `prisma migrate dev --name init` — migration applied
- [x] `pnpm --filter @research-agent/api db:seed` — seed runs successfully
- [x] API returns seeded data via `GET /api/research`

## Files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260822044653_init/migration.sql`
- `apps/api/prisma/seed.ts`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/prisma/prisma.module.ts`
- `packages/shared/src/enums.ts` — `ResearchStatus` type + const
