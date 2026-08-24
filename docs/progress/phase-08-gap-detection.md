# Phase 8 — Research Gap Detection

**Status:** ✅ Complete
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

- [x] Define finding completeness criteria.
- [x] Add gap-analysis Agent step.
- [x] Return structured gaps.
- [x] Create additional research queries.
- [x] Limit research iterations.
- [x] Add maximum source count.
- [x] Add maximum research duration.
- [x] Add token/cost budget.

## Example Output

```ts
{
  gaps: [
    {
      topic: "pricing",
      description: "Need current pricing information",
      searchQueries: ["Inngest pricing plans 2025"]
    }
  ]
}
```

## Implementation

### Gap analysis Agent step

`analyzeGaps(input, findings)` is a Mastra agent step (wrapped in the Temporal
activity `analyzeGaps`) that evaluates the findings collected so far against the
research question and returns a structured `GapAnalysis`:

```ts
{
  isComplete: boolean;   // findings sufficiently answer the question
  rationale: string;     // reasoning for the completeness decision
  gaps: ResearchGap[];   // empty when complete
}
```

### Completeness criteria (encoded in the analyze prompt)

- All major subtopics of the question have at least one finding.
- Each compared option/entity has coverage for features, limitations, and
  (where relevant) pricing.
- Key claims are backed by evidence.
- No major unanswered aspect remains.

### Iterative workflow loop

`researchWorkflow` now loops `Research → Analyze → gaps? → Research gaps`
instead of a fixed pipeline. On each iteration:

1. `performResearch(input, tasks, maxSources)` — researches the current task set.
2. `analyzeGaps(input, findings)` — returns structured gaps.
3. If `isComplete` or no gaps → break and generate the report.
4. Otherwise convert gaps to new `ResearchTask`s (description + searchQueries)
   and loop again.

### Budget limits (safety guards)

`performResearch` and the workflow loop are guarded by a budget (overridable via
`input.budget`):

| Budget            | Default  | Enforcement point            |
| ----------------- | -------- | ---------------------------- |
| `maxIterations`   | 3        | workflow loop condition      |
| `maxSources`      | 30       | `performResearch` fetch/persist |
| `maxDurationMinutes` | 45    | workflow elapsed-time check  |
| `maxTokens`       | 400,000  | accumulated `tokensUsed`     |

Token usage is tracked from each Mastra `agent.generate` response
(`totalUsage.totalTokens`) and returned from each activity, so the workflow can
accumulate a deterministic running total.

### Deduplication

- URLs are deduplicated per research task and against already-used source URLs.
- Existing sources are reused (matched by `researchId + url`) rather than
  recreated.

## Verification

- [x] `pnpm build:shared` — schemas + types compile
- [x] `pnpm -r run typecheck` — all 4 packages pass
- [x] `pnpm --filter @research-agent/api test:e2e` — 12 E2E tests pass
- [ ] Live E2E with Temporal (needs `pnpm db:up` + Tavily key)

## Files

- `apps/worker/src/workflows/research.workflow.ts` — iterative loop with budget guards
- `apps/worker/src/activities/research.activities.ts` — `analyzeGaps` activity + task-based `performResearch` + token tracking
- `packages/shared/src/schemas.ts` — `researchGapSchema`, `gapAnalysisSchema`, `ResearchGap`, `GapAnalysis`
- `packages/shared/src/research.ts` — `ResearchTask`, `ResearchBudget`, `ResearchWorkflowInput.budget`
- `docs/progress/phase-08-gap-detection.md` — this file

## Notes

- Loop has a maximum iteration count to prevent infinite research.
- Budget limits (tokens, cost, sources, duration) are safety guards.
- Gap detection is an agent step (Mastra) wrapped in a Temporal Activity.
- Workflow loop uses Temporal's native loop constructs (stays deterministic).
- `Date.now()` is deterministic inside the workflow sandbox (patched by the
  Temporal SDK), so the duration check is replay-safe.