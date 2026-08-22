# Phase 4 — Temporal Integration

**Status:** ✅ Complete
**Milestone:** M1 — Infrastructure
**Started:** 2026-08-22
**Completed:** 2026-08-22

## Goals

Establish the durable workflow before introducing complex AI behavior.

## Workflow

```
ResearchWorkflow
      │
      ├── initializeResearch    → status: "planning"
      ├── performResearch       → status: "researching" → "analyzing" → "generating_report"
      │   (stub report persisted to DB)
      └── completeResearch       → status: "completed", completedAt set
```

## Tasks

- [x] Configure Temporal client (API: TemporalService with Connection + Client)
- [x] Configure Temporal Worker (Worker.create, taskQueue: "research-agent")
- [x] Create workflow (`researchWorkflow`)
- [x] Create activities (initializeResearch, performResearch, completeResearch)
- [x] Configure retry policies (initialInterval 1s, backoff 2x, max 10s, 3 attempts)
- [x] Configure activity timeouts (startToCloseTimeout: 30s)
- [x] Create workflow index entry (`src/workflows/index.ts`)
- [x] Generate deterministic workflow IDs (`research-{researchId}` — done in Phase 3 API)
- [x] Persist workflow ID against Research record (done in Phase 3 API)
- [x] Update research status from workflow activities
- [ ] Test worker restart recovery (Phase 11)
- [ ] Test workflow retry behavior (Phase 11)

## What Was Done

### Activities persist status to PostgreSQL
- `apps/worker/src/db/prisma.ts` — standalone PrismaClient instance for the worker
- Activities update `Research.status` at each workflow step:
  - `initializeResearch` → `status: "planning"`
  - `performResearch` → `status: "researching"` → `"analyzing"` → `"generating_report"`, then creates a stub `Report` record
  - `completeResearch` → `status: "completed"`, sets `completedAt`
- Stub report contains the question and a placeholder message (real AI reports arrive Phase 7)

### Workflow simplified to Phase 4 target shape
- Reduced from 9 stub activities to 3: `initializeResearch`, `performResearch`, `completeResearch`
- Matches the Plan's initial workflow design
- `performResearch` internally transitions through researching/analyzing/generating_report statuses
- `clarifySignal` handler preserved for Phase 12 (human-in-the-loop)

### End-to-end verified
- POST `/api/research` → creates record, starts Temporal workflow
- Worker picks up workflow, executes all 3 activities
- DB status transitions: `pending` → `planning` → `researching` → `analyzing` → `generating_report` → `completed`
- Stub report persisted to `reports` table
- `completedAt` timestamp set
- Temporal UI shows workflow as `WORKFLOW_EXECUTION_STATUS_COMPLETED`

## Important Rule

Workflow code remains **deterministic**. No HTTP, LLM calls, DB writes, randomness, or `Date.now()` inside workflow code. All side effects go in Activities.

## Verification

- [x] Worker starts and reaches RUNNING state
- [x] Worker connects to Temporal server
- [x] Workflow can be started from API (POST creates + starts workflow)
- [x] Workflow completes end-to-end (Temporal UI: COMPLETED)
- [x] DB status transitions through all stages
- [x] Stub report persisted
- [x] `pnpm typecheck` — all 4 packages pass
- [x] `pnpm test` — 1 unit test pass
- [x] `pnpm test:e2e` — 12 E2E tests pass
- [x] `pnpm build` — API builds successfully
- [ ] Worker restart recovery test (Phase 11)
- [ ] Workflow retry behavior test (Phase 11)

## Files

- `apps/worker/src/worker.ts` — Worker process (NativeConnection, Runtime config)
- `apps/worker/src/workflows/research.workflow.ts` — 3-activity workflow
- `apps/worker/src/workflows/types.ts` — ResearchWorkflowInput (re-exported from shared), clarifySignal
- `apps/worker/src/workflows/index.ts` — workflow entry point for webpack bundler
- `apps/worker/src/activities/research.activities.ts` — 3 activities with DB persistence
- `apps/worker/src/db/prisma.ts` — PrismaClient for worker
- `apps/worker/.env` — Temporal + DB config
- `apps/api/src/temporal/temporal.service.ts` — Temporal client (from Phase 3)
- `packages/shared/src/research.ts` — ResearchWorkflowInput interface
