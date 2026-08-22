# Phase 12 — Human-in-the-Loop

**Status:** ⬜ Not Started
**Milestone:** M6 — Human-in-the-loop
**Dependencies:** Phase 7 (First E2E Workflow), Phase 9 (Progress Events)

## Goals

Allow the agent to ask the user clarification questions during research.

## Flow

```
Agent → Temporal Signal / Wait → waiting_for_user
  → React asks question → User answers → Signal sent → Workflow resumes
```

## Tasks

- [ ] Add workflow signal.
- [ ] Add waiting state.
- [ ] Add NestJS signal endpoint.
- [ ] Add frontend clarification UI.
- [ ] Persist user response.
- [ ] Resume workflow.
- [ ] Add timeout behavior.

## Notes

- `clarifySignal` already defined in `apps/worker/src/workflows/types.ts`
- Signal handler already registered in `researchWorkflow` (stub)
- Temporal Signals allow workflows to wait for external input without timing out
- Need a timeout: if user doesn't respond within X hours, proceed with best guess
- API endpoint: `POST /api/research/:id/clarify` sends Signal to Temporal
