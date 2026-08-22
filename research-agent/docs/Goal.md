Absolutely. Below are two Markdown artifacts: a PRD defining what we're building and a plan breaking the implementation into phases. I've kept the MVP deliberately small while making the architecture capable of evolving into a durable research platform.

Research Agent — Product Requirements Document
Research Agent — Product Requirements Document
1. Overview
Product

Research Agent

Purpose

Research Agent is an AI-powered research platform that allows users to submit complex research questions and receive structured, source-backed reports.

The system uses an AI agent to plan research, search for information, evaluate findings, identify gaps, and produce a final report. Temporal provides durable execution so long-running research tasks can survive failures, restarts, deployments, and periods where the user is offline.

Core technology
React — frontend
NestJS — API and application backend
Temporal — durable workflow execution
Mastra — AI agent and tool orchestration
PostgreSQL — application and research data
Web/search provider — external research sources
2. Problem

Traditional AI chat applications are optimized for short interactions.

Complex research tasks introduce different requirements:

Research can take significant time.
Multiple sources need to be investigated.
Research may need several rounds of searching.
Information can be incomplete or contradictory.
Users may need to provide clarification during research.
The process should survive application or worker failures.
Users should be able to leave and return later.
The final answer should be traceable to sources.

The Research Agent solves these problems by treating research as a durable workflow, rather than a single LLM request.

3. Goals
MVP goals

The MVP should allow a user to:

Submit a research question.
Start a durable research workflow.
See research progress in real time.
Have the agent create a research plan.
Search the web for relevant information.
Retrieve and analyze sources.
Store research findings.
Identify gaps or missing information.
Perform additional research when necessary.
Generate a structured final report.
View the report and its sources.
Leave and return while research is still running.
Future goals

The architecture should eventually support:

Human-in-the-loop clarification.
Scheduled recurring research.
Research projects.
Multiple specialized research agents.
Source quality scoring.
Fact checking.
Report exports.
Email/Slack notifications.
Team collaboration.
Research history and versioning.
4. Non-goals for MVP

The MVP will not attempt to build:

A general-purpose autonomous AI assistant.
A multi-agent architecture.
A custom search engine.
Enterprise collaboration.
Complex document editing.
Automatic publishing.
Fully autonomous browser automation.
Perfect factual verification.

The MVP should demonstrate the architecture and workflow rather than solve every research problem.

5. Primary User

The primary user is an individual who needs to perform moderately complex research.

Example users:

Developers researching technologies.
Product managers researching markets.
Founders researching competitors.
Analysts researching industries.
Students researching topics.
Engineers comparing technical solutions.
6. Primary User Story

As a user, I want to submit a complex research question and receive a structured report containing useful findings and supporting sources without having to manually research every source myself.

Example

User submits:

"Compare the top five payment processors available to Canadian SaaS companies. Compare pricing, features, supported payment methods, and developer experience."

The system should:

Understand the request.
Create a research plan.
Identify candidate companies.
Research each company.
Collect relevant sources.
Extract findings.
Identify missing information.
Perform additional research.
Synthesize the findings.
Generate a final report.
7. User Experience
7.1 Create research

The user sees a simple research form.

Fields:

Research question
Optional additional instructions
Optional research depth

Example:

Research question

Compare the top five payment processors available
to Canadian SaaS companies.

Additional instructions

Focus on pricing, APIs, payment methods,
and developer experience.

[ Start Research ]

7.2 Research progress

After submitting the request, the user is taken to a research progress page.

Example:

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


The UI should update as workflow events occur.

7.3 Research report

When research completes, the user sees:

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


Claims should reference supporting sources wherever practical.

8. Functional Requirements
FR-1: Create Research

The system must allow a user to create a research request.

Input:

{
  question: string;
  instructions?: string;
}


The system creates a research project and starts a Temporal workflow.

FR-2: Durable Research Workflow

Each research request must execute as a Temporal workflow.

The workflow must survive:

Worker restart.
API restart.
Temporary external API failures.
Deployment.
User disconnecting from the frontend.
FR-3: Research Planning

The agent must generate a research plan.

Example:

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

FR-4: Search

The agent must be able to search the web.

The search capability should be exposed to Mastra as a tool.

Conceptually:

searchWeb(query)


The tool returns:

{
  results: [
    {
      title: string;
      url: string;
      snippet: string;
    }
  ];
}

FR-5: Fetch Sources

The agent must be able to retrieve source content.

Conceptually:

fetchPage(url)


The result should contain normalized page content suitable for analysis.

FR-6: Extract Findings

The agent should convert source information into structured findings.

Example:

{
  topic: "Stripe",
  claim: "Stripe supports recurring billing",
  sourceUrl: "...",
  sourceTitle: "...",
  confidence: "high"
}

FR-7: Research Gap Detection

After the initial research pass, the agent should determine whether important information is missing.

Example:

Missing:
- Canadian transaction fees for Provider X
- Supported local payment methods for Provider Y


The workflow can then execute another research iteration.

FR-8: Report Generation

The agent must generate a structured report containing:

Title
Executive summary
Key findings
Comparison where appropriate
Detailed analysis
Recommendations
Sources
FR-9: Progress Tracking

The system must expose workflow progress to the frontend.

Possible states:

type ResearchStatus =
  | "pending"
  | "planning"
  | "researching"
  | "analyzing"
  | "generating_report"
  | "completed"
  | "failed"
  | "waiting_for_user";

FR-10: Real-time Updates

The frontend should receive progress events without polling whenever practical.

The MVP should use Server-Sent Events.

Example:

GET /research/:id/events


Events:

{
  type: "research.step.started",
  step: "researching_source",
  metadata: {...}
}

FR-11: Research History

Users should be able to see previous research requests.

Example:

My Research

Payment processors in Canada       Completed
React state management             Completed
Temporal vs BullMQ                 In progress
Canadian AI regulations            Failed

9. Architecture
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

10. Responsibilities
React

Responsible for:

Research creation.
Research status.
Progress visualization.
Report rendering.
Source navigation.
Research history.

React must not directly communicate with Temporal.

NestJS

Responsible for:

API.
Authentication.
Authorization.
Research CRUD.
Temporal client.
SSE connection.
Persistence.
Application-level validation.
Temporal

Responsible for:

Research workflow lifecycle.
Durable execution.
Retries.
Timeouts.
Waiting.
Workflow state.
Long-running research.
Human interaction in future versions.
Mastra

Responsible for:

Agent configuration.
LLM interaction.
Research planning.
Tool selection.
Reasoning.
Finding extraction.
Research synthesis.
Report generation.
PostgreSQL

Responsible for durable application data:

Users.
Research projects.
Research requests.
Sources.
Findings.
Reports.

Temporal should not be used as the application's general-purpose database.

11. Domain Model
Research
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

Source
Source {
  id: string;
  researchId: string;
  url: string;
  title: string;
  content?: string;
  retrievedAt: Date;
}

Finding
Finding {
  id: string;
  researchId: string;
  sourceId: string;
  claim: string;
  evidence?: string;
  confidence?: string;
}

Report
Report {
  id: string;
  researchId: string;
  title: string;
  content: string;
  createdAt: Date;
}

12. Temporal Workflow

The initial workflow should conceptually look like:

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


The workflow should remain deterministic.

LLM calls, network requests, database operations, and other side effects should execute through Temporal Activities.

13. Mastra Agent

The initial agent should be a single research agent.

Responsibilities:

Understand research request.
Plan research.
Decide what information is needed.
Select tools.
Analyze source material.
Identify gaps.
Generate report.

Initial tools:

searchWeb
fetchPage
extractFindings


Additional tools can be added later.

14. Failure Handling

External services will fail.

The system should use Temporal retry policies for transient failures.

Examples:

Search API timeout
       ↓
Temporal retries Activity
       ↓
Success


If an activity repeatedly fails:

Activity
  ↓
Retry
  ↓
Retry
  ↓
Retry
  ↓
Workflow failure


The frontend should display an actionable failure state.

15. Observability

The MVP should expose enough information to understand what the agent is doing.

Each research workflow should have:

Research ID.
Temporal Workflow ID.
Current step.
Start time.
Completion time.
Error state.
Number of sources.
Number of findings.

Future versions can add tracing across:

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

16. Security

The system should:

Authenticate users.
Authorize access to research projects.
Validate URLs before fetching.
Apply request limits.
Apply research budget/token limits.
Avoid exposing internal workflow IDs unnecessarily.
Sanitize rendered report content.
Prevent arbitrary server-side network access where possible.
17. MVP Success Criteria

The MVP is successful when a user can:

Enter a complex research question.
Start research.
Close the browser.
Return later.
See that research continued.
Watch progress.
Receive a structured report.
Navigate from findings to source URLs.
Recover from transient failures.
View completed research later.
18. Example End-to-End Scenario

User asks:

"Compare Temporal, BullMQ, and Inngest for a NestJS application."

The system:

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


The user receives a source-backed comparison report.

19. Future Features
Human-in-the-loop

The workflow can pause:

WAITING_FOR_USER


The user answers a clarification question and the workflow resumes through a Temporal Signal.

Scheduled Research

Users can schedule:

Every Monday:
  research competitors
  compare with previous report
  notify user if changes detected

Research Projects

Allow multiple research tasks to belong to a project.

Multiple Agents

Potential future agents:

Research Planner
Web Researcher
Fact Checker
Analyst
Report Writer


Temporal can orchestrate these agents while Mastra manages their AI behavior.

20. Product Principle

The central design principle is:

Mastra decides what to do. Temporal makes sure it gets done reliably.

NestJS provides the application boundary, React provides the user experience, and PostgreSQL stores durable business data.

Research Agent — Implementation Plan
Research Agent — Implementation Plan
1. Objective

Build an MVP of the Research Agent using:

React
NestJS
Temporal
Mastra
PostgreSQL
Web search/fetch tools

The implementation should prioritize a clean architecture and a small end-to-end vertical slice before adding advanced agent capabilities.

2. Target Repository

Use a TypeScript monorepo.

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

Applications
web

React frontend.

api

NestJS HTTP API.

worker

Temporal Worker containing workflows and activities, including Mastra integration.

3. Phase 1 — Project Foundation
Goals

Create the repository and local development environment.

Tasks
 Initialize monorepo.
 Create React application.
 Create NestJS application.
 Create Temporal worker application.
 Create shared package.
 Add TypeScript configuration.
 Add linting and formatting.
 Add environment configuration.
 Add Docker Compose.
 Run PostgreSQL locally.
 Run Temporal locally.
 Document local setup.
Expected result

The following should run independently:

React
NestJS
Temporal
Temporal Worker
PostgreSQL

4. Phase 2 — Domain Model
Goals

Create the application's core data model.

Tables

Create:

users
research
sources
findings
reports

Tasks
 Choose ORM.
 Create database schema.
 Add migrations.
 Create Research entity.
 Create Source entity.
 Create Finding entity.
 Create Report entity.
 Add repository/data-access layer.
 Add seed data.
Research status
type ResearchStatus =
  | "pending"
  | "planning"
  | "researching"
  | "analyzing"
  | "generating_report"
  | "completed"
  | "failed"
  | "waiting_for_user";

5. Phase 3 — NestJS API
Goals

Build the API boundary for the frontend.

Endpoints
POST /research
GET  /research
GET  /research/:id
GET  /research/:id/events

POST /research

Request:

{
  "question": "Compare Temporal, BullMQ and Inngest",
  "instructions": "Focus on NestJS integration"
}


Response:

{
  "id": "research_123",
  "status": "pending"
}

Tasks
 Create ResearchModule.
 Create ResearchController.
 Create ResearchService.
 Add request validation.
 Add research creation.
 Add research retrieval.
 Add research listing.
 Add Temporal client.
 Start Temporal workflow from ResearchService.
6. Phase 4 — Temporal Integration
Goals

Establish the durable workflow before introducing complex AI behavior.

Create:

ResearchWorkflow


Initial workflow:

ResearchWorkflow
      │
      ├── initializeResearch
      │
      ├── performResearch
      │
      └── completeResearch

Tasks
 Configure Temporal client.
 Configure Temporal Worker.
 Create workflow.
 Create activities.
 Configure retry policies.
 Configure activity timeouts.
 Generate deterministic workflow IDs.
 Persist workflow ID against Research.
 Update research status from workflow activities.
 Test worker restart recovery.
 Test workflow retry behavior.
Important rule

Keep workflow code deterministic.

Do not perform:

HTTP requests
LLM calls
database writes
randomness
current time calculations


directly inside workflow code.

Put side effects into Activities.

7. Phase 5 — Mastra Agent
Goals

Introduce the research agent.

Create:

Research Agent

Initial capabilities

The agent should:

Understand the research question.
Create a research plan.
Decide what to search for.
Analyze returned information.
Produce structured findings.
Tasks
 Configure Mastra.
 Configure LLM provider.
 Create Research Agent.
 Define system instructions.
 Define research output schemas.
 Create initial agent Activity.
 Invoke Mastra from Temporal Activity.
 Add structured output validation.
8. Phase 6 — Research Tools
Goals

Give the agent access to external information.

Tool 1 — Search
searchWeb(query)


Returns:

{
  results: [
    {
      title: string;
      url: string;
      snippet: string;
    }
  ];
}

Tool 2 — Fetch
fetchPage(url)


Returns normalized page content.

Tool 3 — Save Finding
saveFinding({
  researchId,
  sourceId,
  claim,
  evidence
})

Tasks
 Select search provider.
 Implement search adapter.
 Implement page fetching.
 Normalize page content.
 Add URL validation.
 Implement finding persistence.
 Expose tools to Mastra.
 Add tool error handling.
 Add rate limiting.
9. Phase 7 — First End-to-End Workflow
Goals

Connect everything.

The workflow should become:

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

Tasks
 Connect planning Activity to Mastra.
 Execute search Activity.
 Fetch source Activity.
 Extract findings.
 Persist sources.
 Persist findings.
 Generate report.
 Persist report.
 Mark research completed.
First acceptance test

Input:

Compare Temporal, BullMQ and Inngest
for a NestJS application.


Expected:

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

10. Phase 8 — Research Gap Detection
Goals

Make the agent iterative instead of executing a fixed pipeline.

Change workflow to:

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

Tasks
 Define finding completeness criteria.
 Add gap-analysis Agent step.
 Return structured gaps.
 Create additional research queries.
 Limit research iterations.
 Add maximum source count.
 Add maximum research duration.
 Add token/cost budget.

Example:

{
  gaps: [
    {
      topic: "pricing",
      description: "Need current pricing information"
    }
  ]
}

11. Phase 9 — Progress Events
Goals

Give the user visibility into workflow execution.

Define events:

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

Tasks
 Define event schema.
 Store recent workflow events.
 Add event publishing mechanism.
 Implement NestJS SSE endpoint.
 Connect React EventSource.
 Display workflow progress.
12. Phase 10 — React Application
Goals

Build the user-facing research experience.

Pages
/
  Research dashboard

/research/new
  Create research

/research/:id
  Research progress/report

Components
ResearchForm
ResearchList
ResearchProgress
ResearchStep
ResearchReport
SourceList
FindingList

Tasks
 Build research form.
 Build research history.
 Build progress UI.
 Implement SSE connection.
 Build report renderer.
 Build source links.
 Add loading states.
 Add failure states.
 Add empty states.
13. Phase 11 — Durable Workflow Testing

This phase is particularly important because Temporal is one of the core reasons for the architecture.

Test scenarios
Worker crash
Workflow running
       ↓
Worker killed
       ↓
Worker restarted
       ↓
Workflow continues

 Test worker crash.
 Test worker restart.
 Verify workflow state.
API crash
Research started
       ↓
NestJS crashes
       ↓
Temporal continues

 Test API restart.
 Verify workflow continues.
External API failure
Search
 ↓
Timeout
 ↓
Retry
 ↓
Success

 Test timeout.
 Test retry.
 Test permanent failure.
Browser disconnect
React
  ↓
disconnect
  ↓
Temporal continues
  ↓
React reconnects
  ↓
current state displayed

 Disconnect browser.
 Verify workflow continues.
 Reconnect.
 Verify current progress.
14. Phase 12 — Human-in-the-Loop

This should come after the basic workflow works.

Example

Agent encounters ambiguity:

"I found two similarly named companies.
Which one should I research?"


Workflow:

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

Tasks
 Add workflow signal.
 Add waiting state.
 Add NestJS signal endpoint.
 Add frontend clarification UI.
 Persist user response.
 Resume workflow.
 Add timeout behavior.
15. Phase 13 — Scheduled Research

After the MVP is stable, add recurring research.

Example:

Every Monday
      ↓
Research competitors
      ↓
Compare against previous report
      ↓
Detect changes
      ↓
Generate update

Tasks
 Add Temporal Schedules.
 Create ResearchSchedule entity.
 Add schedule management API.
 Add schedule UI.
 Compare historical findings.
 Add change detection.
 Add notifications.
16. Phase 14 — Observability
Tasks
 Add structured logging.
 Add correlation IDs.
 Include Research ID in logs.
 Include Temporal Workflow ID.
 Track agent execution time.
 Track tool execution time.
 Track LLM token usage.
 Track estimated cost.
 Track source count.
 Track workflow failures.

Recommended correlation:

researchId
    │
    ├── NestJS request
    ├── Temporal workflow
    ├── Temporal activity
    ├── Mastra execution
    └── LLM request

17. Testing Strategy
Unit tests

Test:

DTO validation.
Domain services.
Tool input/output.
Finding extraction.
Report formatting.
Workflow tests

Test:

Normal execution.
Activity retries.
Activity failures.
Workflow state.
Signals.
Timers.
Integration tests

Test:

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

End-to-end test

Use a deterministic mock research provider.

Input:

Compare Product A and Product B.


Expected:

Research created
→ Plan created
→ Sources found
→ Findings created
→ Report generated
→ Research completed

18. MVP Milestones
Milestone 1 — Infrastructure
React
NestJS
Temporal
Worker
PostgreSQL


Definition of done:

Everything runs locally.
NestJS can start a Temporal workflow.
Worker executes workflow.
Milestone 2 — Basic Agent
NestJS
 ↓
Temporal
 ↓
Mastra
 ↓
LLM


Definition of done:

User submits question.
Agent produces research plan.
Workflow completes.
Milestone 3 — Real Research
Agent
 ↓
Search
 ↓
Fetch
 ↓
Findings
 ↓
Report


Definition of done:

Agent can research a real topic.
Sources are stored.
Findings are stored.
Report is generated.
Milestone 4 — Frontend

Definition of done:

User can create research.
User sees progress.
User can view report.
User can view sources.
User can leave/reconnect.
Milestone 5 — Durable Execution

Definition of done:

Worker restart does not lose workflow.
API restart does not lose workflow.
External failures retry.
Browser disconnect does not stop research.
Milestone 6 — Human-in-the-loop

Definition of done:

Agent can ask clarification question.
Workflow waits.
User responds.
Workflow resumes.
19. Suggested MVP Scope

The first release should contain only:

✓ React
✓ NestJS
✓ Temporal
✓ Mastra
✓ PostgreSQL
✓ Search tool
✓ Fetch tool
✓ Single research agent
✓ Research planning
✓ Finding extraction
✓ Report generation
✓ SSE progress
✓ Durable execution


Do not initially build:

✗ Multi-agent
✗ Scheduling
✗ Team collaboration
✗ Notifications
✗ Complex RAG
✗ Document uploads
✗ Browser automation
✗ Autonomous infinite research

20. Final MVP Architecture
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

21. Definition of Done

The MVP is complete when this scenario works reliably:

1. User opens React.

2. User enters:
   "Compare Temporal, BullMQ and Inngest
    for a NestJS application."

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