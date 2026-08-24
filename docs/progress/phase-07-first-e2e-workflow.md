# Phase 7 — First End-to-End Workflow

**Status:** ✅ Complete
**Milestone:** M3 — Real Research
**Dependencies:** Phase 5 (Mastra Agent), Phase 6 (Research Tools)
**Started:** 2026-08-22
**Completed:** 2026-08-22

## Goals

Connect everything — full pipeline from question to source-backed report.

## Target Workflow

```
ResearchWorkflow
  │
  ├── initializeResearch       → status: "planning"
  ├── createResearchPlan       → Mastra agent generates structured plan
  ├── performResearch          → search → fetch → extract findings per step
  │     (per step: Tavily search, Cheerio fetch, agent extraction, Prisma persist)
  │     → status: "researching" then "analyzing"
  ├── generateReport           → agent synthesizes findings into Markdown report
  │     → status: "generating_report"
  └── completeResearch         → status: "completed", completedAt set
```

## Tasks

- [x] Connect planning Activity to Mastra (createResearchPlan)
- [x] Execute search Activity (performResearch calls searchWeb per step)
- [x] Fetch source Activity (performResearch calls fetchPage per result)
- [x] Extract findings (performResearch calls agent.generate with findingsSchema)
- [x] Persist sources (Prisma source.create in performResearch)
- [x] Persist findings (Prisma finding.create in performResearch)
- [x] Generate report (generateReport calls agent.generate with generatedReportSchema)
- [x] Persist report (Prisma report.create in generateReport)
- [x] Mark research completed (completeResearch sets status + completedAt)

## First Acceptance Test — PASSED ✅

**Input:**

```
Compare Temporal, BullMQ, and Inngest for a NestJS application
Focus on durability, developer experience, and pricing
```

**Result:**

| Metric | Value |
|--------|-------|
| Status | `completed` |
| Total time | ~4.5 min |
| Sources collected | 8 |
| Findings extracted | 31 |
| Report generated | Yes (14,296 chars Markdown) |
| Report title | "Temporal vs. BullMQ vs. Inngest for a NestJS Application" |

**Status transitions observed:**

```
pending → planning → researching (3 min) → generating_report (1.5 min) → completed
```

**Temporal retry in action:** The report generation activity got an "Service Unavailable" error from the LLM API on the first attempt. Temporal retried (as configured: 3 max attempts, 2s initial interval, 2x backoff) and the second attempt succeeded.

## Decisions

### Activity orchestration (not agent-autonomous tools)

For Phase 7's structured pipeline, activities call the search/fetch adapters directly (not via Mastra tools). The agent is used only for the "thinking" tasks:
- `createResearchPlan` — agent generates plan (structured output)
- `performResearch` — activity orchestrates search → fetch → agent extraction loop
- `generateReport` — agent synthesizes findings into report (structured output)

The Mastra tools (searchWeb, fetchPage, saveFinding) remain attached to the agent for future use (Phase 8 gap detection may use autonomous tool calling).

### Timeouts increased

- `startToCloseTimeout`: 5 min (from 60s) — research with multiple LLM calls + web fetches takes time
- `retry.maximumAttempts`: 3 (same) — but with longer backoff (2s initial, 60s max)
- `retry.backoffCoefficient`: 2 (same)

### Finding extraction limits

- `MAX_RESULTS_PER_QUERY`: 3 (Tavily results per search query)
- `MAX_PAGES_PER_STEP`: 3 (pages fetched per plan step)
- Page content truncated to 8K chars when sent to agent for extraction
- Total content per extraction call: up to 24K chars (3 pages × 8K)

### Report schema

```ts
generatedReportSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  content: z.string().describe('Full report body in Markdown'),
});
```

Report is persisted as `executiveSummary + content` concatenated, rendered as Markdown in the UI via `react-markdown`.

## What's Done

- Full pipeline: plan → search → fetch → extract → report → complete
- Real web search via Tavily
- Real page fetching + content extraction via Cheerio
- Real LLM-based finding extraction (31 findings from 8 sources)
- Real LLM-based report generation (14K char Markdown report)
- All persistence working (sources, findings, reports in PostgreSQL)
- DB status transitions through all stages
- Temporal retry handles transient LLM API failures
- UI renders the report with `react-markdown`

## What's Left for Phase 8

- Gap detection (agent evaluates if findings are incomplete)
- Iterative research (loop back to search if gaps found)
- Budget limits (max sources, max iterations, token/cost caps)

## Verification

- [x] `pnpm typecheck` — all 4 packages pass
- [x] `pnpm test` — 1 unit test pass
- [x] `pnpm test:e2e` — 12 E2E tests pass
- [x] Live E2E: POST → plan → search → fetch → extract (31 findings) → report (14K chars) → completed ✅
- [x] Sources persisted to DB (8 sources with URLs + titles)
- [x] Findings persisted to DB (31 findings with claims + confidence)
- [x] Report persisted to DB (Markdown, 14K chars)
- [x] Temporal retry recovered from transient LLM API error
- [x] Status transitions: pending → planning → researching → analyzing → generating_report → completed

## Files

- `apps/worker/src/activities/research.activities.ts` — 5 activities (initialize, plan, research, report, complete)
- `apps/worker/src/workflows/research.workflow.ts` — full pipeline workflow
- `packages/shared/src/schemas.ts` — `generatedReportSchema` added
- `apps/worker/src/tools/search-adapter.ts` — Tavily search (from Phase 6)
- `apps/worker/src/tools/fetch-adapter.ts` — Cheerio fetch (from Phase 6)
- `apps/worker/src/tools/url-validation.ts` — SSRF prevention (from Phase 6)
