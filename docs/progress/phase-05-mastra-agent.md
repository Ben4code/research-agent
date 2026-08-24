# Phase 5 — Mastra Agent

**Status:** ✅ Complete
**Milestone:** M2 — Basic Agent
**Dependencies:** Phase 4 (Temporal Integration)
**Started:** 2026-08-22
**Completed:** 2026-08-22

## Goals

Introduce the research agent.

## Initial Capabilities

The agent can:

- Understand the research question.
- Create a structured research plan with steps and search queries.
- Decide what to search for.
- Return structured output validated by Zod schemas.

(Full analysis and findings extraction arrive in Phase 6–7 with search/fetch tools.)

## Tasks

- [x] Configure Mastra (`@mastra/core`, `mastra` packages installed)
- [x] Configure LLM provider (`openai/gpt-4o-mini` via Mastra model router)
- [x] Create Research Agent (`apps/worker/src/mastra/agents/research-agent.ts`)
- [x] Define system instructions (research planning prompt)
- [x] Define research output schemas (`researchPlanSchema`, `researchStepSchema`, `findingSchema` in shared)
- [x] Create initial agent Activity (`createResearchPlan` calls `agent.generate()` with structured output)
- [x] Invoke Mastra from Temporal Activity
- [x] Add structured output validation (Zod schema passed to `structuredOutput.schema`)
- [x] Live E2E test with OpenCode Go API key — agent generated a 4-step research plan in ~30s

## Decisions

### LLM Provider: OpenCode Go (hy3)

- Model configured as string `'opencode-go/hy3'` in Mastra's `provider/model` format
- No provider import needed — Mastra auto-detects `OPENCODE_API_KEY` env var
- Cheapest model available: $0.02/1M input, $0.07/1M output, 256K context window
- Can be swapped by changing one string (e.g. `opencode-go/deepseek-v4-flash` for larger context)
- Activity timeout increased to 60s (from 30s) to accommodate LLM latency
- Ref: https://mastra.ai/models/providers/opencode-go

### Mastra Agent Architecture

- `Agent` from `@mastra/core/agent` — no `create-mastra` scaffold needed
- Agent instantiated directly in worker code, not as a separate Mastra server
- `Mastra` instance at `apps/worker/src/mastra/index.ts` registers the agent
- Agent retrieved in activity via `mastra.getAgentById('research-agent')`
- Structured output via `agent.generate(prompt, { structuredOutput: { schema } })` → `response.object`

### Zod Schemas in Shared Package

Added to `packages/shared/src/schemas.ts`:

- `researchStepSchema` — `{ description, searchQueries[], targets[] }`
- `researchPlanSchema` — `{ topic, summary, steps[] }`
- `findingSchema` — `{ topic, claim, sourceUrl, sourceTitle, confidence }`
- `findingsSchema` — `{ findings[] }`

These schemas are the single source of truth — used by Mastra for structured output and available to the frontend for type safety.

### Workflow Shape (Phase 5)

```
ResearchWorkflow
  │
  ├── initializeResearch     → status: "planning"
  ├── createResearchPlan     → Mastra agent generates structured plan
  │     (returns ResearchPlan with steps + search queries)
  └── completeResearch        → status: "completed"
```

Search/fetch/extract activities arrive in Phase 6–7.

### Mastra Storage Warning

Mastra logs a warning about in-memory storage on startup. This is fine for development — the agent doesn't need persistent memory for stateless planning calls. A persistent storage adapter (`@mastra/pg`) can be added later if memory/thread features are needed.

## What's Done

- Research Agent created with system instructions for breaking down research questions
- `createResearchPlan` activity calls `agent.generate()` with `researchPlanSchema` as structured output
- Plan result (topic, summary, steps with search queries) returned to workflow
- Workflow logs the plan summary
- All typechecks pass across 4 packages
- All 13 tests pass (1 unit + 12 E2E)
- Worker starts and reaches RUNNING state with Mastra agent loaded

## What's Left for Phase 6–7

- Add search tool (`searchWeb`) — Phase 6
- Add fetch tool (`fetchPage`) — Phase 6
- Add save finding tool — Phase 6
- Wire tools to agent — Phase 6
- Execute search → fetch → extract in workflow — Phase 7
- Generate real report from findings — Phase 7
- Persist sources, findings, reports — Phase 7

## Verification

- [x] `pnpm typecheck` — all 4 packages pass
- [x] `pnpm test` — 1 unit test pass
- [x] `pnpm test:e2e` — 12 E2E tests pass
- [x] Worker starts with Mastra agent loaded — reaches RUNNING state
- [x] No crash on startup (API key not needed until `agent.generate()` is called)
- [x] Live E2E: POST → workflow → agent generates plan → plan logged ✅

## How to Test Live

1. Add `OPENCODE_API_KEY=your-key` to `apps/worker/.env`
2. Start infra: `pnpm db:up`
3. Start worker: `pnpm dev:worker`
4. Start API: `pnpm dev:api`
5. POST: `curl -X POST http://localhost:3001/api/research -H "Content-Type: application/json" -d '{"question":"Compare Temporal, BullMQ, and Inngest for NestJS"}'`
6. Check worker logs for "Research plan created" with topic + step count
7. Check Temporal UI at http://localhost:8233 for completed workflow

## Files

- `apps/worker/src/mastra/index.ts` — Mastra instance
- `apps/worker/src/mastra/agents/research-agent.ts` — Research Agent (system instructions, model config)
- `apps/worker/src/activities/research.activities.ts` — 3 activities (initialize, createResearchPlan, complete)
- `apps/worker/src/workflows/research.workflow.ts` — updated workflow (plan step added)
- `apps/worker/.env` — `OPENCODE_API_KEY` added
- `packages/shared/src/schemas.ts` — `researchPlanSchema`, `researchStepSchema`, `findingSchema`, `findingsSchema`
- `packages/shared/src/research.ts` — removed duplicate `Finding`/`ResearchPlan` interfaces (now Zod-inferred types)
