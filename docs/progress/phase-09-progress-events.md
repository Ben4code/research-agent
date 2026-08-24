# Phase 9 — Progress Events

**Status:** ✅ Complete
**Milestone:** M4 — Frontend
**Dependencies:** Phase 4 (Temporal Integration)

## Goals

Give the user visibility into workflow execution.

## Event Types

```ts
type ResearchEvent =
  | "research.started"
  | "research.planning"
  | "research.searching"
  | "research.source_found"
  | "research.analyzing"
  | "research.gap_detected"
  | "research.generating_report"
  | "research.completed"
  | "research.failed";
```

## Tasks

- [x] Define event schema.
- [x] Store recent workflow events.
- [x] Add event publishing mechanism.
- [x] Implement NestJS SSE endpoint (`GET /api/research/:id/events`).
- [x] Connect React EventSource.
- [x] Display workflow progress.

## Implementation

### Event schema (shared)

`packages/shared/src/events.ts` defines `ResearchEventType`, `ResearchEvent`,
plus zod schemas (`researchEventSchema`, `researchEventsResponseSchema`) used
for typed responses.

### Storage (Prisma)

New `ResearchEvent` model (`apps/api/prisma/schema.prisma`):

```
id, sequence (autoincrement), researchId, type, step, message, metadata (Json), timestamp
```

`sequence` is a monotonic cursor so the SSE poller never skips or duplicates
events (even same-millisecond inserts).

### Publishing (worker)

Activities publish events via a `publishEvent()` helper in
`apps/worker/src/activities/research.activities.ts`:

| Activity         | Events published                                  |
| ---------------- | ------------------------------------------------- |
| initializeResearch | `research.started`                              |
| createResearchPlan | `research.planning` (with step list)            |
| performResearch   | `research.searching` (per task), `research.source_found` (per new source), `research.analyzing` |
| analyzeGaps       | `research.analyzing` (complete) or `research.gap_detected` |
| generateReport    | `research.generating_report`                     |
| completeResearch  | `research.completed`                             |
| failResearch      | `research.failed` (workflow catch path)          |

`researchWorkflow` now wraps execution in try/catch and calls `failResearch` on
any error before re-throwing.

### NestJS SSE endpoint

`ResearchService.streamEvents()` returns an RxJS `Observable` that polls the DB
every 1s for events with `sequence > lastSequence`, emits each event as an SSE
frame, and completes once the research reaches a terminal status
(`completed`/`failed`). Exposed via `@Sse(':id/events')` in
`ResearchController` (respects the global `/api` prefix → `GET /api/research/:id/events`).

### React EventSource connection

`apps/web/src/components/research-progress.tsx` is a client component that:
- Opens an `EventSource` to `/api/research/:id/events`.
- Attaches a listener per event type (the API emits named SSE events, e.g.
  `event: research.started`, which the browser dispatches as custom events —
  not the default `message`).
- Renders a live vertical timeline of steps (label, message, timestamp) with an
  active "Working…" indicator while connected.
- Closes the stream and calls `router.refresh()` when `research.completed` or
  `research.failed` arrives, so the server-rendered report/status updates.

The detail page (`/research/[id]`) renders `<ResearchProgress>` for any
non-terminal status, and `<StatsTabs>` otherwise.

### Loading states (Phase 10)

`loading.tsx` skeletons added for `/research` and `/research/[id]`.

## Verification

- [x] `pnpm -r run typecheck` — all 4 packages pass
- [x] `pnpm --filter @research-agent/api test:e2e` — 13 E2E tests pass (incl. SSE stream + 404)
- [x] Live SSE: `curl /api/research/:id/events` emits `event:`/`id:`/`data:` frames and closes on terminal status
- [x] Live UI: progress timeline renders events + "Working…" spinner; `router.refresh()` on completion
- [x] Contrast + overflow checks pass (light + dark, desktop + mobile)
- [x] IMPECCABLE detector clean on changed files

## Files

- `packages/shared/src/events.ts` — event schemas + types
- `apps/api/prisma/schema.prisma` + migrations — `ResearchEvent` model
- `apps/api/src/research/research.service.ts` — `streamEvents()` SSE observable
- `apps/api/src/research/research.controller.ts` — `@Sse(':id/events')`
- `apps/worker/src/activities/research.activities.ts` — `publishEvent()` + per-activity events + `failResearch`
- `apps/worker/src/workflows/research.workflow.ts` — try/catch + `failResearch`
- `apps/web/src/components/research-progress.tsx` — EventSource timeline component
- `apps/web/src/app/research/[id]/page.tsx` — wires `<ResearchProgress>` for in-progress research
- `apps/web/src/app/research/loading.tsx`, `apps/web/src/app/research/[id]/loading.tsx` — loading skeletons

## Notes

- SSE (Server-Sent Events) — no polling on the client; the server polls the DB
  as a simple store-and-stream (no external pub/sub needed).
- Events are stored in the DB and streamed to any number of subscribers.
- Frontend uses the browser `EventSource` API against the SSE endpoint.
- Enables the `ResearchProgress` / `ResearchStep` UI components (Phase 10).