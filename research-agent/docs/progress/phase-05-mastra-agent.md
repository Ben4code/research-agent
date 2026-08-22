# Phase 5 — Mastra Agent

**Status:** ⬜ Not Started
**Milestone:** M2 — Basic Agent
**Dependencies:** Phase 4 (Temporal Integration)

## Goals

Introduce the research agent.

## Initial Capabilities

The agent should:

- Understand the research question.
- Create a research plan.
- Decide what to search for.
- Analyze returned information.
- Produce structured findings.

## Tasks

- [ ] Configure Mastra.
- [ ] Configure LLM provider.
- [ ] Create Research Agent.
- [ ] Define system instructions.
- [ ] Define research output schemas.
- [ ] Create initial agent Activity.
- [ ] Invoke Mastra from Temporal Activity.
- [ ] Add structured output validation.

## Decisions

- **LLM provider:** TBD (OpenAI, Anthropic, or other)
- **Mastra version:** TBD
- **Output schema:** Use Zod for structured output validation

## Notes

- Agent runs inside Temporal Activities, not workflow code
- All LLM calls are non-deterministic side effects → must be in Activities
- Structured output (Zod schemas) ensures findings are typed and valid
- This phase makes the stub `createResearchPlan` and `extractFindings` activities real
