# Phase 8 — Research Gap Detection

**Status:** ⬜ Not Started
**Milestone:** M3 — Real Research
**Dependencies:** Phase 7 (First E2E Workflow)

## Goals

Make the agent iterative instead of executing a fixed pipeline.

## Target Workflow

```
Plan → Research → Analyze → Are there important gaps?
  │
  ├── Yes → Research gaps → loop back
  │
  └── No → Generate report
```

## Tasks

- [ ] Define finding completeness criteria.
- [ ] Add gap-analysis Agent step.
- [ ] Return structured gaps.
- [ ] Create additional research queries.
- [ ] Limit research iterations.
- [ ] Add maximum source count.
- [ ] Add maximum research duration.
- [ ] Add token/cost budget.

## Example Output

```ts
{
  gaps: [
    {
      topic: "pricing",
      description: "Need current pricing information"
    }
  ]
}
```

## Notes

- Loop must have a maximum iteration count to prevent infinite research
- Budget limits (tokens, cost, sources, duration) are safety guards
- Gap detection is an agent step (Mastra) wrapped in a Temporal Activity
- Workflow loop uses Temporal's native loop constructs (must stay deterministic)
