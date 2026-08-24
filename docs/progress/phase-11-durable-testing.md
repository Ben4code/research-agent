# Phase 11 — Durable Workflow Testing

**Status:** ⬜ Not Started
**Milestone:** M5 — Durable Execution
**Dependencies:** Phase 7 (First E2E Workflow)

## Goals

Prove that Temporal's durability guarantees work in practice.

## Test Scenarios

### Worker Crash

```
Workflow running → Worker killed → Worker restarted → Workflow continues
```

- [ ] Test worker crash.
- [ ] Test worker restart.
- [ ] Verify workflow state.

### API Crash

```
Research started → NestJS crashes → Temporal continues
```

- [ ] Test API restart.
- [ ] Verify workflow continues.

### External API Failure

```
Search → Timeout → Retry → Success
```

- [ ] Test timeout.
- [ ] Test retry.
- [ ] Test permanent failure.

### Browser Disconnect

```
React disconnect → Temporal continues → React reconnects → current state displayed
```

- [ ] Disconnect browser.
- [ ] Verify workflow continues.
- [ ] Reconnect.
- [ ] Verify current progress.

## Notes

- This is the most important phase for proving the architecture
- Use Temporal's `Worker.run()` lifecycle for crash/restart tests
- Simulate external failures with mock search/fetch tools
- Browser disconnect test: close tab, reopen, verify SSE reconnects
