# Research Agent — Product Requirements Document

## 1. Overview

### Product

Research Agent

### Purpose

Research Agent is an AI-powered research platform that allows users to submit complex research questions and receive structured, source-backed reports.

The system uses an AI agent to plan research, search for information, evaluate findings, identify gaps, and produce a final report. Temporal provides durable execution so long-running research tasks can survive failures, restarts, deployments, and periods where the user is offline.

### Core technology

- **React** — frontend
- **NestJS** — API and application backend
- **Temporal** — durable workflow execution
- **Mastra** — AI agent and tool orchestration
- **PostgreSQL** — application and research data
- **Web/search provider** — external research sources

## 2. Problem

Traditional AI chat applications are optimized for short interactions.

Complex research tasks introduce different requirements:

- Research can take significant time.
- Multiple sources need to be investigated.
- Research may need several rounds of searching.
- Information can be incomplete or contradictory.
- Users may need to provide clarification during research.
- The process should survive application or worker failures.
- Users should be able to leave and return later.
- The final answer should be traceable to sources.

The Research Agent solves these problems by treating research as a durable workflow, rather than a single LLM request.

## 3. Goals

### MVP goals

The MVP should allow a user to:

- Submit a research question.
- Start a durable research workflow.
- See research progress in real time.
- Have the agent create a research plan.
- Search the web for relevant information.
- Retrieve and analyze sources.
- Store research findings.
- Identify gaps or missing information.
- Perform additional research when necessary.
- Generate a structured final report.
- View the report and its sources.
- Leave and return while research is still running.

### Future goals

The architecture should eventually support:

- Human-in-the-loop clarification.
- Scheduled recurring research.
- Research projects.
- Multiple specialized research agents.
- Source quality scoring.
- Fact checking.
- Report exports.
- Email/Slack notifications.
- Team collaboration.
- Research history and versioning.

## 4. Non-goals for MVP

The MVP will not attempt to build:

- A general-purpose autonomous AI assistant.
- A multi-agent architecture.
- A custom search engine.
- Enterprise collaboration.
- Complex document editing.
- Automatic publishing.
- Fully autonomous browser automation.
- Perfect factual verification.

The MVP should demonstrate the architecture and workflow rather than solve every research problem.

## 5. Primary User

The primary user is an individual who needs to perform moderately complex research.

Example users:

- Developers researching technologies.
- Product managers researching markets.
- Founders researching competitors.
- Analysts researching industries.
- Students researching topics.
- Engineers comparing technical solutions.

## 6. Primary User Story

As a user, I want to submit a complex research question and receive a structured report containing useful findings and supporting sources without having to manually research every source myself.

### Example

User submits:

> "Compare the top five payment processors available to Canadian SaaS companies. Compare pricing, features, supported payment methods, and developer experience."

The system should:

- Understand the request.
- Create a research plan.
- Identify candidate companies.
- Research each company.
- Collect relevant sources.
- Extract findings.
- Identify missing information.
- Perform additional research.
- Synthesize the findings.
- Generate a final report.

## 7. User Experience

### 7.1 Create research

The user sees a simple research form.

Fields:

- Research question
- Optional additional instructions
- Optional research depth

Example:

```
Research question

Compare the top five payment processors available
to Canadian SaaS companies.

Additional instructions

Focus on pricing, APIs, payment methods,
and developer experience.

[ Start Research ]
```

### 7.2 Research progress

After submitting the request, the user is taken to a research progress page.

Example:

```
Researching...

✓ Understanding research question
✓ Creating research plan
✓ Identifying companies
✓ Researching Stripe
✓ Researching Adyen
⟳ Researching Square
○ Researching Moneris
○ Analyzing findings
○ Generating report
```

The UI should update as workflow events occur.

### 7.3 Research report

When research completes, the user sees:

```markdown
# Payment Processors for Canadian SaaS

## Executive Summary

...

## Comparison

| Provider | Pricing | Payment Methods | API |
|----------|---------|-----------------|-----|

## Stripe

...

## Adyen

...

## Recommendations

...

## Sources

1. Stripe Pricing
2. Adyen Pricing
3. ...
```

Claims should reference supporting sources wherever practical.

## 8. Functional Requirements

### FR-1: Create Research

The system must allow a user to create a research request.

Input:

```ts
{
  question: string;
  instructions?: string;
}
```

The system creates a research project and starts a Temporal workflow.

### FR-2: Durable Research Workflow

Each research request must execute as a Temporal workflow.

The workflow must survive:

- Worker restart.
- API restart.
- Temporary external API failures.
- Deployment.
- User disconnecting from the frontend.

### FR-3: Research Planning

The agent must generate a research plan.

Example:

```
Research topic:
Payment processors for Canadian SaaS

Plan:
1. Identify major providers.
2. Research pricing.
3. Research supported payment methods.
4. Research API/developer experience.
5. Compare providers.
6. Identify gaps.
7. Generate report.
```

### FR-4: Search

The agent must be able to search the web.

The search capability should be exposed to Mastra as a tool.

Conceptually:

```ts
searchWeb(query)
```

The tool returns:

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

### FR-5: Fetch Sources

The agent must be able to retrieve source content.

Conceptually:

```ts
fetchPage(url)
```

The result should contain normalized page content suitable for analysis.

### FR-6: Extract Findings

The agent should convert source information into structured findings.

Example:

```ts
{
  topic: "Stripe",
  claim: "Stripe supports recurring billing",
  sourceUrl: "...",
  sourceTitle: "...",
  confidence: "high"
}
```

### FR-7: Research Gap Detection

After the initial research pass, the agent should determine whether important information is missing.

Example:

```
Missing:
- Canadian transaction fees for Provider X
- Supported local payment methods for Provider Y
```

The workflow can then execute another research iteration.

### FR-8: Report Generation

The agent must generate a structured report containing:

- Title
- Executive summary
- Key findings
- Comparison where appropriate
- Detailed analysis
- Recommendations
- Sources

### FR-9: Progress Tracking

The system must expose workflow progress to the frontend.

Possible states:

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

### FR-10: Real-time Updates

The frontend should receive progress events without polling whenever practical.

The MVP should use Server-Sent Events.

Example:

```
GET /research/:id/events
```

Events:

```ts
{
  type: "research.step.started",
  step: "researching_source",
  metadata: {...}
}
```

### FR-11: Research History

Users should be able to see previous research requests.

Example:

```
My Research

Payment processors in Canada       Completed
React state management             Completed
Temporal vs BullMQ                 In progress
Canadian AI regulations            Failed
```

## 9. Architecture

```
                    ┌──────────────────┐
                    │      React       │
                    │                  │
                    │ Research UI      │
                    │ Progress         │
                    │ Reports          │
                    └────────┬─────────┘
                             │
                          HTTP / SSE
                             │
                             ▼
                    ┌──────────────────┐
                    │      NestJS      │
                    │                  │
                    │ REST API         │
                    │ Auth             │
                    │ Research CRUD    │
                    └────────┬─────────┘
                             │
                        Temporal Client
                             │
                             ▼
                    ┌──────────────────┐
                    │     Temporal     │
                    │                  │
                    │ ResearchWorkflow │
                    └────────┬─────────┘
                             │
                          Activities
                             │
                             ▼
                    ┌──────────────────┐
                    │  Mastra Agent    │
                    │                  │
                    │ Planning         │
                    │ Reasoning        │
                    │ Tools            │
                    └───────┬──────────┘
                            │
                ┌───────────┼────────────┐
                ▼           ▼            ▼
              Search       Fetch       Database
               API         Web Page    PostgreSQL
```

## 10. Responsibilities

### React

Responsible for:

- Research creation.
- Research status.
- Progress visualization.
- Report rendering.
- Source navigation.
- Research history.

React must not directly communicate with Temporal.

### NestJS

Responsible for:

- API.
- Authentication.
- Authorization.
- Research CRUD.
- Temporal client.
- SSE connection.
- Persistence.
- Application-level validation.

### Temporal

Responsible for:

- Research workflow lifecycle.
- Durable execution.
- Retries.
- Timeouts.
- Waiting.
- Workflow state.
- Long-running research.
- Human interaction in future versions.

### Mastra

Responsible for:

- Agent configuration.
- LLM interaction.
- Research planning.
- Tool selection.
- Reasoning.
- Finding extraction.
- Research synthesis.
- Report generation.

### PostgreSQL

Responsible for durable application data:

- Users.
- Research projects.
- Research requests.
- Sources.
- Findings.
- Reports.

Temporal should not be used as the application's general-purpose database.

## 11. Domain Model

### Research

```ts
Research {
  id: string;
  userId: string;
  question: string;
  instructions?: string;
  status: ResearchStatus;
  workflowId: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### Source

```ts
Source {
  id: string;
  researchId: string;
  url: string;
  title: string;
  content?: string;
  retrievedAt: Date;
}
```

### Finding

```ts
Finding {
  id: string;
  researchId: string;
  sourceId: string;
  claim: string;
  evidence?: string;
  confidence?: string;
}
```

### Report

```ts
Report {
  id: string;
  researchId: string;
  title: string;
  content: string;
  createdAt: Date;
}
```

## 12. Temporal Workflow

The initial workflow should conceptually look like:

```
ResearchWorkflow
  │
  ├── createResearchPlan()
  │
  ├── identifyResearchTargets()
  │
  ├── researchTargets()
  │      ├── search()
  │      ├── fetch()
  │      └── extractFindings()
  │
  ├── analyzeResearch()
  │
  ├── identifyGaps()
  │
  ├── researchGaps()
  │
  └── generateReport()
```

The workflow should remain deterministic.

LLM calls, network requests, database operations, and other side effects should execute through Temporal Activities.

## 13. Mastra Agent

The initial agent should be a single research agent.

Responsibilities:

- Understand research request.
- Plan research.
- Decide what information is needed.
- Select tools.
- Analyze source material.
- Identify gaps.
- Generate report.

Initial tools:

- `searchWeb`
- `fetchPage`
- `extractFindings`

Additional tools can be added later.

## 14. Failure Handling

External services will fail.

The system should use Temporal retry policies for transient failures.

Examples:

```
Search API timeout
       ↓
Temporal retries Activity
       ↓
Success
```

If an activity repeatedly fails:

```
Activity
  ↓
Retry
  ↓
Retry
  ↓
Retry
  ↓
Workflow failure
```

The frontend should display an actionable failure state.

## 15. Observability

The MVP should expose enough information to understand what the agent is doing.

Each research workflow should have:

- Research ID.
- Temporal Workflow ID.
- Current step.
- Start time.
- Completion time.
- Error state.
- Number of sources.
- Number of findings.

Future versions can add tracing across:

```
React
  ↓
NestJS
  ↓
Temporal
  ↓
Mastra
  ↓
LLM
  ↓
External APIs
```

## 16. Security

The system should:

- Authenticate users.
- Authorize access to research projects.
- Validate URLs before fetching.
- Apply request limits.
- Apply research budget/token limits.
- Avoid exposing internal workflow IDs unnecessarily.
- Sanitize rendered report content.
- Prevent arbitrary server-side network access where possible.

## 17. MVP Success Criteria

The MVP is successful when a user can:

- Enter a complex research question.
- Start research.
- Close the browser.
- Return later.
- See that research continued.
- Watch progress.
- Receive a structured report.
- Navigate from findings to source URLs.
- Recover from transient failures.
- View completed research later.

## 18. Example End-to-End Scenario

User asks:

> "Compare Temporal, BullMQ, and Inngest for a NestJS application."

The system:

```
Create Research
       ↓
Temporal Workflow
       ↓
Mastra creates plan
       ↓
Search Temporal
       ↓
Fetch official documentation
       ↓
Extract findings
       ↓
Search BullMQ
       ↓
Fetch documentation
       ↓
Extract findings
       ↓
Search Inngest
       ↓
Fetch documentation
       ↓
Extract findings
       ↓
Identify missing comparison criteria
       ↓
Additional research
       ↓
Generate comparison
       ↓
Generate report
       ↓
Completed
```

The user receives a source-backed comparison report.

## 19. Future Features

### Human-in-the-loop

The workflow can pause:

```
WAITING_FOR_USER
```

The user answers a clarification question and the workflow resumes through a Temporal Signal.

### Scheduled Research

Users can schedule:

```
Every Monday:
  research competitors
  compare with previous report
  notify user if changes detected
```

### Research Projects

Allow multiple research tasks to belong to a project.

### Multiple Agents

Potential future agents:

- Research Planner
- Web Researcher
- Fact Checker
- Analyst
- Report Writer

Temporal can orchestrate these agents while Mastra manages their AI behavior.

## 20. Product Principle

The central design principle is:

> **Mastra decides what to do. Temporal makes sure it gets done reliably.**

NestJS provides the application boundary, React provides the user experience, and PostgreSQL stores durable business data.
