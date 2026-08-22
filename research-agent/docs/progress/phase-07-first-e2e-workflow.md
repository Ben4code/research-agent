# Phase 7 — First End-to-End Workflow

**Status:** ⬜ Not Started
**Milestone:** M3 — Real Research
**Dependencies:** Phase 5 (Mastra Agent), Phase 6 (Research Tools)

## Goals

Connect everything.

## Target Workflow

```
ResearchWorkflow
      │
      ▼
Create Plan
      │
      ▼
Search
      │
      ▼
Fetch Sources
      │
      ▼
Extract Findings
      │
      ▼
Generate Report
```

## Tasks

- [ ] Connect planning Activity to Mastra.
- [ ] Execute search Activity.
- [ ] Fetch source Activity.
- [ ] Extract findings.
- [ ] Persist sources.
- [ ] Persist findings.
- [ ] Generate report.
- [ ] Persist report.
- [ ] Mark research completed.

## First Acceptance Test

**Input:**

```
Compare Temporal, BullMQ and Inngest
for a NestJS application.
```

**Expected flow:**

```
Research created → Plan created → Sources found → Findings created → Report generated → Research completed
```

## Notes

- This is the first time the full pipeline runs with real AI + real search
- Replace all stub activities with real implementations
- Workflow should update Research status at each step (pending → planning → researching → analyzing → generating_report → completed)
- All persistence (sources, findings, reports) happens in Activities via Prisma
