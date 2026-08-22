# Phase 14 — Observability

**Status:** ⬜ Not Started
**Milestone:** Post-MVP
**Dependencies:** Phase 7 (First E2E Workflow)

## Goals

Add structured logging, tracing, and metrics across the stack.

## Tasks

- [ ] Add structured logging.
- [ ] Add correlation IDs.
- [ ] Include Research ID in logs.
- [ ] Include Temporal Workflow ID.
- [ ] Track agent execution time.
- [ ] Track tool execution time.
- [ ] Track LLM token usage.
- [ ] Track estimated cost.
- [ ] Track source count.
- [ ] Track workflow failures.

## Correlation Chain

```
researchId
    │
    ├── NestJS request
    ├── Temporal workflow
    ├── Temporal activity
    ├── Mastra execution
    └── LLM request
```

## Notes

- Correlation ID (researchId) should propagate through every layer
- Temporal has built-in search attributes for workflow filtering
- LLM token tracking: capture usage from provider responses
- Cost estimation: per-token pricing × usage
- Consider OpenTelemetry for distributed tracing in production
- This is post-MVP but can be incrementally added alongside other phases
