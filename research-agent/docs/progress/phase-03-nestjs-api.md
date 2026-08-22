# Phase 3 — NestJS API

**Status:** ✅ Complete
**Milestone:** M1 — Infrastructure
**Started:** 2026-08-22
**Completed:** 2026-08-22

## Goals

Build the API boundary for the frontend.

## Endpoints

```
POST /api/research              ✅ Creates research + starts Temporal workflow
GET  /api/research              ✅ Lists all research projects
GET  /api/research/:id          ✅ Research detail with sources, findings, reports
GET  /api/research/:id/events   ⬜ Deferred to Phase 9 (SSE)
```

## Tasks

- [x] Create ResearchModule
- [x] Create ResearchController
- [x] Create ResearchService
- [x] Add request validation — Zod schemas (shared with frontend)
- [x] Add research creation (POST /api/research)
- [x] Add research retrieval (GET /api/research/:id)
- [x] Add research listing (GET /api/research)
- [x] Add health endpoint (GET /api/health)
- [x] Add Temporal client (TemporalModule + TemporalService)
- [x] Start Temporal workflow from ResearchService
- [x] Generate deterministic workflow IDs (`research-{researchId}`)
- [x] Persist workflow ID against Research record
- [x] E2E test for research CRUD (12 tests: health, create, validation, list, detail, 404, workflow failure)
- [ ] Add SSE endpoint (GET /api/research/:id/events) — deferred to Phase 9

## Decisions

### Validation: Zod (replaces class-validator + class-transformer)

- Zod schemas live in `@research-agent/shared` — single source of truth for API + frontend
- Types derived via `z.infer<>` — no manual interface duplication
- `ZodValidationPipe<T>` at `apps/api/src/common/pipes/zod-validation.pipe.ts`
- Returns structured errors: `{ message, errors: [{ field, message }] }`
- `class-validator` and `class-transformer` removed from API dependencies

### Temporal client integration

- `TemporalService` wraps `@temporalio/client` `Connection` + `Client`
- Connects on module init (`OnModuleInit`), disconnects on destroy (`OnModuleDestroy`)
- `TemporalModule` is `@Global()` — available to all modules without explicit imports
- `startResearchWorkflow(workflowId, input)` calls `client.workflow.start('researchWorkflow', {...})`
- Workflow type referenced by string name (not imported from worker) — avoids bundling worker code in API
- `ResearchWorkflowInput` interface moved to `@research-agent/shared` so both API and worker share it

### Workflow lifecycle on POST

1. Create Research record in PostgreSQL with `status: "pending"`
2. Generate deterministic workflow ID: `research-{research.id}`
3. Call `TemporalService.startResearchWorkflow()` with `{ researchId, question, instructions }`
4. On success: update Research record with `workflowId`
5. On failure: update Research record with `status: "failed"`, return `{ id, status: "failed" }`

### E2E testing strategy

- Mock `PrismaService` and `TemporalService` via `overrideProvider()`
- Test app sets `setGlobalPrefix('api')` to match production behavior
- 12 test cases covering: health, create (happy path, no instructions, validation errors, unknown field stripping, workflow failure), list (populated, empty), detail (found, 404)

## Verification

- [x] `GET /api/health` → `{ status: "ok" }`
- [x] `GET /api/research` → list of seeded projects
- [x] `GET /api/research/:id` → detail with sources, findings, reports
- [x] `POST /api/research` valid → `{ id, status: "pending" }` + workflow started + workflowId persisted
- [x] `POST /api/research` empty question → `400 { message, errors }`
- [x] `POST /api/research` extra fields → stripped by Zod, `201`
- [x] `POST /api/research` workflow failure → `{ id, status: "failed" }`
- [x] `GET /api/research/:id` nonexistent → `404`
- [x] `pnpm typecheck` — all packages pass
- [x] `pnpm test` — unit tests pass (1 test)
- [x] `pnpm test:e2e` — E2E tests pass (12 tests)
- [x] `pnpm build` — API builds successfully

## Files

- `apps/api/src/research/research.module.ts`
- `apps/api/src/research/research.controller.ts`
- `apps/api/src/research/research.service.ts`
- `apps/api/src/temporal/temporal.module.ts`
- `apps/api/src/temporal/temporal.service.ts`
- `apps/api/src/common/pipes/zod-validation.pipe.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/test/research.e2e-spec.ts` — 11 E2E tests
- `packages/shared/src/schemas.ts` — Zod schemas + inferred types
- `packages/shared/src/research.ts` — `ResearchWorkflowInput` interface
