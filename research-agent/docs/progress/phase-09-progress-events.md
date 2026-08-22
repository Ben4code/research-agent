# Phase 9 — Progress Events

**Status:** ⬜ Not Started
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

- [ ] Define event schema.
- [ ] Store recent workflow events.
- [ ] Add event publishing mechanism.
- [ ] Implement NestJS SSE endpoint (`GET /api/research/:id/events`).
- [ ] Connect React EventSource.
- [ ] Display workflow progress.

## Notes

- SSE (Server-Sent Events) — no polling
- Events can be published via Temporal sinks or stored in DB and streamed
- Frontend uses `EventSource` API to connect to SSE endpoint
- Enables the `ResearchProgress` and `ResearchStep` UI components (Phase 10)
- Events already partially defined in `packages/shared/src/events.ts`
