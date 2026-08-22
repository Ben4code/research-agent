# Phase 1 — Project Foundation

**Status:** ✅ Complete
**Milestone:** M1 — Infrastructure
**Started:** 2026-08-22
**Completed:** 2026-08-22

## Goals

Create the repository and local development environment.

## Tasks

- [x] Initialize monorepo (pnpm workspaces)
- [x] Create React application (Next.js 16, App Router)
- [x] Create NestJS application (NestJS 11)
- [x] Create Temporal worker application (Temporal TS SDK 1.22)
- [x] Create shared package (`@research-agent/shared`)
- [x] Add TypeScript configuration (tsconfig.base.json)
- [x] Add linting and formatting (ESLint + Prettier)
- [x] Add environment configuration (.env.example in each app)
- [x] Add Docker Compose (PostgreSQL + Temporal + Temporal UI)
- [x] Run PostgreSQL locally (port 5434)
- [x] Run Temporal locally (port 7233, UI on 8233)
- [x] Document local setup (README.md)

## Decisions

- **Monorepo:** pnpm workspaces (not turborepo — keep it simple)
- **Frontend:** Next.js App Router + Tailwind CSS v4 + shadcn/ui (base-ui, not Radix)
- **API:** NestJS on port 3001 (Next.js occupies 3000)
- **Testing:** Vitest (not Jest) with unplugin-swc for NestJS decorator support
- **Temporal:** `temporalio/auto-setup:1.25` all-in-one Docker image with dedicated PostgreSQL
- **PostgreSQL port:** 5434 (5432 was in use by another container)
- **Worker dev:** tsx watch (no compile step needed for dev)
- **shadcn/ui:** Uses base-ui primitives, no `asChild` prop — use `buttonVariants` + `Link` instead

## Verification

- [x] `pnpm typecheck` — all 4 packages pass
- [x] `pnpm test` — all packages pass
- [x] `pnpm build` — web + api build successfully
- [x] `docker compose ps` — all 4 containers healthy
- [x] Temporal UI accessible at http://localhost:8233
- [x] Worker connects to Temporal and reaches RUNNING state

## Notes

- Temporal dynamic config requires array-wrapped values: `- value: false` not bare `false`
- `pnpm-workspace.yaml` needs `onlyBuiltDependencies` for prisma/esbuild/swc build scripts
- Worker `workflowsPath` requires an `index.ts` entry file that re-exports all workflows
