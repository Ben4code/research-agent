# Research Agent — Implementation Plan

## 1. Objective

Build an MVP of the Research Agent using:

- React
- NestJS
- Temporal
- Mastra
- PostgreSQL
- Web search/fetch tools

The implementation should prioritize a clean architecture and a small end-to-end vertical slice before adding advanced agent capabilities.

## 2. Target Repository

Use a TypeScript monorepo.

```
research-agent/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
│
├── packages/
│   └── shared/
│
├── docker-compose.yml
├── package.json
└── README.md
```

### Applications

- **web** — React frontend.
- **api** — NestJS HTTP API.
- **worker** — Temporal Worker containing workflows and activities, including Mastra integration.

## 3. Phase 1 — Project Foundation

### Goals

Create the repository and local development environment.

### Tasks

- [ ] Initialize monorepo.
- [ ] Create React application.
- [ ] Create NestJS application.
- [ ] Create Temporal worker application.
- [ ] Create shared package.
- [ ] Add TypeScript configuration.
- [ ] Add linting and formatting.
- [ ] Add environment configuration.
- [ ] Add Docker Compose.
- [ ] Run PostgreSQL locally.
- [ ] Run Temporal locally.
- [ ] Document local setup.

### Expected result

The following should run independently:

- React
- NestJS
- Temporal
- Temporal Worker
- PostgreSQL

## 4. Phase 2 — Domain Model

### Goals

Create the application's core data model.

### Tables

Create:

- `users`
- `research`
- `sources`
- `findings`
- `reports`

### Tasks

- [ ] Choose ORM.
- [ ] Create database schema.
- [ ] Add migrations.
- [ ] Create Research entity.
- [ ] Create Source entity.
- [ ] Create Finding entity.
- [ ] Create Report entity.
- [ ] Add repository/data-access layer.
- [ ] Add seed data.

### Research status

```ts
type ResearchStatus =
  | "pending"
  | "planning"
  | "researching"
  | "analyzing"
  | "generating_report"
  | "completed"
  | "failed"
  | "waiting_for_user";
```

## 5. Phase 3 — NestJS API

### Goals

Build the API boundary for the frontend.

### Endpoints

```
POST /research
GET  /research
GET  /research/:id
GET  /research/:id/events
```

#### `POST /research`

Request:

```json
{
  "question": "Compare Temporal, BullMQ and Inngest",
  "instructions": "Focus on NestJS integration"
}
```

Response:

```json
{
  "id": "research_123",
  "status": "pending"
}
```

### Tasks

- [ ] Create ResearchModule.
- [ ] Create ResearchController.
- [ ] Create ResearchService.
- [ ] Add request validation.
- [ ] Add research creation.
- [ ] Add research retrieval.
- [ ] Add research listing.
- [ ] Add Temporal client.
- [ ] Start Temporal workflow from ResearchService.

## 6. Phase 4 — Temporal Integration

### Goals

Establish the durable workflow before introducing complex AI behavior.

Create:

```
ResearchWorkflow
```

Initial workflow:

```
ResearchWorkflow
      │
      ├── initializeResearch
      │
      ├── performResearch
      │
      └── completeResearch
```

### Tasks

- [ ] Configure Temporal client.
- [ ] Configure Temporal Worker.
- [ ] Create workflow.
- [ ] Create activities.
- [ ] Configure retry policies.
- [ ] Configure activity timeouts.
- [ ] Generate deterministic workflow IDs.
- [ ] Persist workflow ID against Research.
- [ ] Update research status from workflow activities.
- [ ] Test worker restart recovery.
- [ ] Test workflow retry behavior.

### Important rule

Keep workflow code deterministic.

Do **not** perform:

- HTTP requests
- LLM calls
- database writes
- randomness
- current time calculations

directly inside workflow code.

Put side effects into Activities.

## 7. Phase 5 — Mastra Agent

### Goals

Introduce the research agent.

Create:

```
Research Agent
```

### Initial capabilities

The agent should:

- Understand the research question.
- Create a research plan.
- Decide what to search for.
- Analyze returned information.
- Produce structured findings.

### Tasks

- [ ] Configure Mastra.
- [ ] Configure LLM provider.
- [ ] Create Research Agent.
- [ ] Define system instructions.
- [ ] Define research output schemas.
- [ ] Create initial agent Activity.
- [ ] Invoke Mastra from Temporal Activity.
- [ ] Add structured output validation.

## 8. Phase 6 — Research Tools

### Goals

Give the agent access to external information.

### Tool 1 — Search

```ts
searchWeb(query)
```

Returns:

```ts
{
  results: [
    {
      title: string;
      url: string;
      snippet: string;
    }
  ];
}
```

### Tool 2 — Fetch

```ts
fetchPage(url)
```

Returns normalized page content.

### Tool 3 — Save Finding

```ts
saveFinding({
  researchId,
  sourceId,
  claim,
  evidence
})
```

### Tasks

- [ ] Select search provider.
- [ ] Implement search adapter.
- [ ] Implement page fetching.
- [ ] Normalize page content.
- [ ] Add URL validation.
- [ ] Implement finding persistence.
- [ ] Expose tools to Mastra.
- [ ] Add tool error handling.
- [ ] Add rate limiting.

## 9. Phase 7 — First End-to-End Workflow

### Goals

Connect everything.

The workflow should become:

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

### Tasks

- [ ] Connect planning Activity to Mastra.
- [ ] Execute search Activity.
- [ ] Fetch source Activity.
- [ ] Extract findings.
- [ ] Persist sources.
- [ ] Persist findings.
- [ ] Generate report.
- [ ] Persist report.
- [ ] Mark research completed.

### First acceptance test

Input:

```
Compare Temporal, BullMQ and Inngest
for a NestJS application.
```

Expected:

```
Research
   ↓
Plan
   ↓
Search
   ↓
Sources
   ↓
Findings
   ↓
Report
```

## 10. Phase 8 — Research Gap Detection

### Goals

Make the agent iterative instead of executing a fixed pipeline.

Change workflow to:

```
Plan
  ↓
Research
  ↓
Analyze
  ↓
Are there important gaps?
  │
  ├── Yes → Research gaps
  │           │
  │           └───────┐
  │                   ▼
  └── No ───────→ Generate report
```

### Tasks

- [x] Define finding completeness criteria.
- [x] Add gap-analysis Agent step.
- [x] Return structured gaps.
- [x] Create additional research queries.
- [x] Limit research iterations.
- [x] Add maximum source count.
- [x] Add maximum research duration.
- [x] Add token/cost budget.

### Example

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

## 11. Phase 9 — Progress Events

### Goals

Give the user visibility into workflow execution.

### Define events

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

### Tasks

- [x] Define event schema.
- [x] Store recent workflow events.
- [x] Add event publishing mechanism.
- [x] Implement NestJS SSE endpoint.
- [x] Connect React EventSource.
- [x] Display workflow progress.

## 12. Phase 10 — React Application

### Goals

Build the user-facing research experience.

### Pages

- `/` — Research dashboard
- `/research/new` — Create research
- `/research/:id` — Research progress/report

### Components

- `ResearchForm`
- `ResearchList`
- `ResearchProgress`
- `ResearchStep`
- `ResearchReport`
- `SourceList`
- `FindingList`

### Tasks

- [x] Build research form.
- [x] Build research history.
- [x] Build progress UI.
- [x] Implement SSE connection.
- [x] Build report renderer.
- [x] Build source links.
- [x] Add loading states.
- [x] Add failure states.
- [x] Add empty states.

## 13. Phase 11 — Durable Workflow Testing

This phase is particularly important because Temporal is one of the core reasons for the architecture.

### Test scenarios

#### Worker crash

```
Workflow running
       ↓
Worker killed
       ↓
Worker restarted
       ↓
Workflow continues
```

- [ ] Test worker crash.
- [ ] Test worker restart.
- [ ] Verify workflow state.

#### API crash

```
Research started
       ↓
NestJS crashes
       ↓
Temporal continues
```

- [ ] Test API restart.
- [ ] Verify workflow continues.

#### External API failure

```
Search
  ↓
Timeout
  ↓
Retry
  ↓
Success
```

- [ ] Test timeout.
- [ ] Test retry.
- [ ] Test permanent failure.

#### Browser disconnect

```
React
  ↓
disconnect
  ↓
Temporal continues
  ↓
React reconnects
  ↓
current state displayed
```

- [ ] Disconnect browser.
- [ ] Verify workflow continues.
- [ ] Reconnect.
- [ ] Verify current progress.

## 14. Phase 12 — Human-in-the-Loop

This should come after the basic workflow works.

### Example

Agent encounters ambiguity:

> "I found two similarly named companies.
> Which one should I research?"

### Workflow

```
Agent
  ↓
Temporal Signal / Wait
  ↓
waiting_for_user
  ↓
React asks question
  ↓
User answers
  ↓
Signal sent
  ↓
Workflow resumes
```

### Tasks

- [ ] Add workflow signal.
- [ ] Add waiting state.
- [ ] Add NestJS signal endpoint.
- [ ] Add frontend clarification UI.
- [ ] Persist user response.
- [ ] Resume workflow.
- [ ] Add timeout behavior.

## 15. Phase 13 — Scheduled Research

After the MVP is stable, add recurring research.

### Example

```
Every Monday
       ↓
Research competitors
       ↓
Compare against previous report
       ↓
Detect changes
       ↓
Generate update
```

### Tasks

- [ ] Add Temporal Schedules.
- [ ] Create ResearchSchedule entity.
- [ ] Add schedule management API.
- [ ] Add schedule UI.
- [ ] Compare historical findings.
- [ ] Add change detection.
- [ ] Add notifications.

## 16. Phase 14 — Observability

### Tasks

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

### Recommended correlation

```
researchId
    │
    ├── NestJS request
    ├── Temporal workflow
    ├── Temporal activity
    ├── Mastra execution
    └── LLM request
```

## 17. Testing Strategy

### Unit tests

Test:

- DTO validation.
- Domain services.
- Tool input/output.
- Finding extraction.
- Report formatting.

### Workflow tests

Test:

- Normal execution.
- Activity retries.
- Activity failures.
- Workflow state.
- Signals.
- Timers.

### Integration tests

Test:

```
React
  ↓
NestJS
  ↓
Temporal
  ↓
Worker
  ↓
Mastra
  ↓
Mock tools
```

### End-to-end test

Use a deterministic mock research provider.

Input:

```
Compare Product A and Product B.
```

Expected:

```
Research created
→ Plan created
→ Sources found
→ Findings created
→ Report generated
→ Research completed
```

## 18. MVP Milestones

### Milestone 1 — Infrastructure

```
React
NestJS
Temporal
Worker
PostgreSQL
```

Definition of done:

- Everything runs locally.
- NestJS can start a Temporal workflow.
- Worker executes workflow.

### Milestone 2 — Basic Agent

```
NestJS
  ↓
Temporal
  ↓
Mastra
  ↓
LLM
```

Definition of done:

- User submits question.
- Agent produces research plan.
- Workflow completes.

### Milestone 3 — Real Research

```
Agent
  ↓
Search
  ↓
Fetch
  ↓
Findings
  ↓
Report
```

Definition of done:

- Agent can research a real topic.
- Sources are stored.
- Findings are stored.
- Report is generated.

### Milestone 4 — Frontend

Definition of done:

- User can create research.
- User sees progress.
- User can view report.
- User can view sources.
- User can leave/reconnect.

### Milestone 5 — Durable Execution

Definition of done:

- Worker restart does not lose workflow.
- API restart does not lose workflow.
- External failures retry.
- Browser disconnect does not stop research.

### Milestone 6 — Human-in-the-loop

Definition of done:

- Agent can ask clarification question.
- Workflow waits.
- User responds.
- Workflow resumes.

## 19. Suggested MVP Scope

The first release should contain only:

- ✓ React
- ✓ NestJS
- ✓ Temporal
- ✓ Mastra
- ✓ PostgreSQL
- ✓ Search tool
- ✓ Fetch tool
- ✓ Single research agent
- ✓ Research planning
- ✓ Finding extraction
- ✓ Report generation
- ✓ SSE progress
- ✓ Durable execution

Do not initially build:

- ✗ Multi-agent
- ✗ Scheduling
- ✗ Team collaboration
- ✗ Notifications
- ✗ Complex RAG
- ✗ Document uploads
- ✗ Browser automation
- ✗ Autonomous infinite research

## 20. Final MVP Architecture

```
                         ┌──────────────┐
                         │    React     │
                         │              │
                         │ Research     │
                         │ Progress     │
                         │ Report       │
                         └──────┬───────┘
                                │
                             HTTP/SSE
                                │
                                ▼
                         ┌──────────────┐
                         │    NestJS    │
                         │              │
                         │ API          │
                         │ Auth         │
                         │ Persistence  │
                         └──────┬───────┘
                                │
                          Temporal Client
                                │
                                ▼
                     ┌──────────────────────┐
                     │       Temporal       │
                     │                      │
                     │ Research Workflow    │
                     └──────────┬───────────┘
                                │
                            Activities
                                │
                                ▼
                     ┌──────────────────────┐
                     │    Mastra Agent      │
                     │                      │
                     │ Plan                 │
                     │ Research             │
                     │ Analyze              │
                     │ Report               │
                     └──────────┬───────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
                 Search       Fetch      PostgreSQL
                   API         Web       Findings
```

## 21. Definition of Done

The MVP is complete when this scenario works reliably:

1. User opens React.
2. User enters:
   > "Compare Temporal, BullMQ and Inngest
   >  for a NestJS application."
3. React sends request to NestJS.
4. NestJS creates Research record.
5. NestJS starts Temporal workflow.
6. Temporal executes research plan.
7. Mastra agent searches the web.
8. Sources are fetched and stored.
9. Agent extracts findings.
10. Agent identifies research gaps.
11. Additional research is performed.
12. Agent generates final report.
13. Report is stored.
14. React receives completion event.
15. User sees report and sources.
16. Worker can be restarted during the process
    without losing the research workflow.

The most important architectural property is that the research is a durable process rather than an HTTP request.

That is what makes the combination of Temporal + Mastra genuinely useful.
