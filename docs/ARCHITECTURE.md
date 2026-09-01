# Architecting Production-Grade Durable AI Systems
## A Comprehensive Architectural Blueprint & Case Study of DroidSearch

> **Target Audience:** Software Architects, AI Engineers, and Full-Stack Developers  
> **Core Focus:** Building resilient, long-running, fault-tolerant AI agent systems using Workflow Orchestration ([Temporal.io](https://docs.temporal.io/)), Agent Frameworks ([Mastra](https://mastra.ai/docs)), Modular Backends ([NestJS](https://docs.nestjs.com/) + [Prisma](https://www.prisma.io/docs)), and Reactive Frontends ([Next.js](https://nextjs.org/docs) + [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)).

---

## Table of Contents

1. [The Challenge: Why Naive AI Agents Fail in Production](#1-the-challenge-why-naive-ai-agents-fail-in-production)
2. [High-Level Architectural Topology](#2-high-level-architectural-topology)
3. [Monorepo & Codebase Organization](#3-monorepo--codebase-organization)
4. [The Durability Engine: Temporal.io Deep Dive](#4-the-durability-engine-temporalio-deep-dive)
5. [The AI Agent Intelligence Layer: Mastra & Structured Outputs](#5-the-ai-agent-intelligence-layer-mastra--structured-outputs)
6. [Persistence & Data Modeling: PostgreSQL + Prisma](#6-persistence--data-modeling-postgresql--prisma)
7. [API Gateway & Event Streaming: NestJS + Server-Sent Events (SSE)](#7-api-gateway--event-streaming-nestjs--server-sent-events-sse)
8. [Frontend & Interactive Experience: Next.js + Tailwind v4](#8-frontend--interactive-experience-nextjs--tailwind-v4)
9. [Infrastructure & Local Development Orchestration](#9-infrastructure--local-development-orchestration)
10. [Key Architectural Lessons & Design Patterns](#10-key-architectural-lessons--design-patterns)
11. [Master Reference & Curated Reading List](#11-master-reference--curated-reading-list)

---

## 1. The Challenge: Why Naive AI Agents Fail in Production

Building a prototype AI script that calls an LLM in a `while` loop takes minutes. However, running autonomous, multi-step research or reasoning workloads in production reveals critical failure modes:

| Failure Mode | Naive Implementation | Durable Architecture Solution | Key Concept / Reference |
| :--- | :--- | :--- | :--- |
| **Transient API Failures** | A 429 rate limit, 503 gateway error, or network drop crashes the entire 15-minute research loop. | **Automatic Activity Retries** with jitter and exponential backoff managed by an external orchestrator. | [Temporal Activity Retries](https://docs.temporal.io/dev-guide/typescript/foundations#activity-retries) |
| **Server Restarts & Deployments** | If a worker crashes or deploys mid-execution, all in-memory agent state is lost. | **Event-Sourced Workflow Replay**: Workflows automatically resume from the exact last successful step on a new worker. | [Temporal Event History](https://docs.temporal.io/workflows#event-history) |
| **Runaway Costs / Infinite Loops** | An LLM hallucinating exit conditions loops endlessly, draining API budgets. | **Multi-dimensional Budget Bounding** (tokens, duration, iterations, source caps) checked deterministically in code. | [Deterministic Workflows](https://docs.temporal.io/workflows#deterministic-constraints) |
| **Lack of Observability** | Users stare at a spinner with no feedback on what sources the agent has discovered. | **Granular Event Sinks & Replayable SSE Streams** capturing every micro-state transition. | [MDN Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) |
| **Coupled State & Execution** | Background agent processes run in HTTP request handlers, causing gateway timeouts. | **Decoupled Asynchronous Workflows**: HTTP triggers workflow initiation; execution occurs on isolated worker pools. | [Temporal Workflow Client](https://docs.temporal.io/develop/typescript/core-application#start-a-workflow-execution) |

---

## 2. High-Level Architectural Topology

The system uses a **Decoupled Event-Driven Microservices Architecture** organized as a unified monorepo:

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Browser)"]
        UI["Next.js 16 App Router\n(React 19 + Tailwind v4)"]
    end

    subgraph APILayer ["API Gateway (Port 3001)"]
        Nest["NestJS API\n(Controllers, Services, Scalar Docs)"]
        SSE["Server-Sent Events (SSE) Stream\n(/api/research/:id/events)"]
    end

    subgraph OrchestrationLayer ["Durability & State Engine"]
        TemporalServer["Temporal Server (Port 7233)\nWorkflow Orchestration & Event History"]
        TemporalUI["Temporal Web UI (Port 8233)"]
    end

    subgraph WorkerPool ["Worker Layer (Background)"]
        Worker["Temporal Worker Process"]
        Workflow["Deterministic Workflow\n(researchWorkflow)"]
        Activities["Activities Engine\n(initialize, plan, search, extract, gap analysis, report)"]
        MastraAgent["Mastra Agent Framework\n(Structured LLM Outputs + Zod Schemas)"]
    end

    subgraph DataLayer ["Data & External Services"]
        PostgresApp[("Application PostgreSQL (Port 5434)\n(Research, Sources, Findings, Events)")]
        PostgresTemporal[("Temporal PostgreSQL (Port 5433)\n(Workflow State & History)")]
        ExternalLLM["LLM Provider (OpenCode / Anthropic / OpenAI)"]
        SearchAPIs["Search & Scraper APIs (Exa / Tavily / Cheerio)"]
    end

    %% Client Interactions
    UI -->|1. POST /api/research| Nest
    UI -->|2. SSE Connection (Live Updates)| SSE

    %% API to Orchestration & DB
    Nest -->|Create Record| PostgresApp
    Nest -->|Start Workflow Execution| TemporalServer

    %% Worker Execution Loop
    TemporalServer -->|Dispatch Task| Worker
    Worker --> Workflow
    Workflow --> Activities
    Activities --> MastraAgent
    MastraAgent --> ExternalLLM
    Activities --> SearchAPIs
    Activities -->|Append Events & Findings| PostgresApp

    %% SSE Stream Updates
    PostgresApp -.->|Poll / Sequence Replay| SSE
    SSE -.->|Real-time JSON Progress Events| UI
```

---

## 3. Monorepo & Codebase Organization

The repository leverages **`pnpm` Workspaces** with TypeScript project references. This provides complete type-safety across backend, frontend, worker, and schema layers without duplicated code.

```
research-agent/
├── apps/
│   ├── api/          # NestJS REST & SSE Gateway (Node.js/Express)
│   ├── web/          # Next.js 16 Frontend (App Router, Tailwind v4)
│   └── worker/       # Temporal Worker + Mastra Agent Execution Runtime
├── packages/
│   └── shared/       # Shared Zod Schemas, Domain Types, Event Enums, DTOs
├── docker-compose.yml# Dual-PostgreSQL + Temporal Cluster setup
└── pnpm-workspace.yaml
```

- **Docs:** [pnpm Workspaces Guide](https://pnpm.io/workspaces) | [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

### Shared Single-Source-of-Truth Contracts (`packages/shared`)

Both the API validation layer and the LLM structured output generator share the exact same [Zod](https://zod.dev/) schemas:

```typescript
// packages/shared/src/schemas.ts
import { z } from 'zod';

export const researchStatusSchema = z.enum([
  'pending',
  'planning',
  'researching',
  'analyzing',
  'generating_report',
  'completed',
  'failed',
]);

export const findingSchema = z.object({
  topic: z.string(),
  claim: z.string(),
  evidence: z.string().optional(),
  sourceUrl: z.string(),
  sourceTitle: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const gapAnalysisSchema = z.object({
  isComplete: z.boolean().describe('True when findings answer the question'),
  rationale: z.string().describe('Reasoning for completeness decision'),
  gaps: z.array(z.object({
    topic: z.string(),
    description: z.string(),
    searchQueries: z.array(z.string()),
  })),
});
```

---

## 4. The Durability Engine: Temporal.io Deep Dive

### Why Workflow Orchestration Over Message Queues (BullMQ / Celery)?

Standard queues (like Redis/BullMQ) are stateless task runners. If an agent task takes 30 minutes across 5 steps and fails at step 4:
- A queue retries the entire job from step 1 (wasting money and duplicating queries).
- Handling timeouts, human-in-the-loop signals, and dynamic branch graphs requires writing complex state machines in your database.

**Temporal** solves this via **Event Sourcing**:
1. Workflows are purely deterministic execution graphs.
2. Every external interaction (API call, DB write, LLM prompt) is encapsulated inside an **Activity**.
3. When an activity succeeds, its result is recorded in Temporal’s event history.
4. If a worker crashes, Temporal spins up another worker and **replays** the workflow. It fast-forwards through previously completed activities instantly without re-executing them, picking up right at the exact failure point.

- **Docs:** [Temporal Workflows](https://docs.temporal.io/workflows) | [Temporal Activities](https://docs.temporal.io/activities) | [Temporal Determinism Constraints](https://docs.temporal.io/workflows#deterministic-constraints)

### Workflow Implementation (`apps/worker/src/workflows/research.workflow.ts`)

```typescript
import { proxyActivities, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities/research.activities.js';
import type { ResearchBudget, ResearchWorkflowInput } from '@research-agent/shared';

// 1. Configure Activity Proxies with Retry Policies & Timeouts
const {
  initializeResearch,
  createResearchPlan,
  performResearch,
  analyzeGaps,
  generateReport,
  completeResearch,
  failResearch,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5m', // Activity timeout
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumInterval: '60s',
    maximumAttempts: 3,     // Automatic resilience against 429/500 errors
  },
});

export async function researchWorkflow(input: ResearchWorkflowInput): Promise<void> {
  const budget: ResearchBudget = {
    maxIterations: 3,
    maxSources: 30,
    maxDurationMinutes: 45,
    maxTokens: 400_000,
    ...(input.budget ?? {}),
  };

  const startedAt = Date.now();
  let totalTokens = 0;
  let sources: string[] = [];
  let allFindings = [];

  await initializeResearch(input);

  // Phase 1: Planning
  const { plan, tokensUsed: planTokens } = await createResearchPlan(input);
  totalTokens += planTokens;

  let tasks = plan.steps.map(step => ({
    description: step.description,
    searchQueries: step.searchQueries,
  }));

  // Phase 2: Iterative Research & Gap Detection Loop
  for (let iteration = 0; iteration < budget.maxIterations; iteration++) {
    const research = await performResearch(input, tasks, budget.maxSources);
    allFindings = allFindings.concat(research.findings);
    sources = research.sources;
    totalTokens += research.tokensUsed;

    // Hard Budget Guards
    if (
      sources.length >= budget.maxSources ||
      totalTokens >= budget.maxTokens ||
      Date.now() - startedAt >= budget.maxDurationMinutes * 60000
    ) {
      break;
    }

    // Gap Analysis Activity (LLM checks if research is complete)
    const { analysis, tokensUsed: gapTokens } = await analyzeGaps(input, allFindings);
    totalTokens += gapTokens;

    if (analysis.isComplete || analysis.gaps.length === 0) {
      break;
    }

    // Re-assign missing areas as subsequent tasks
    tasks = analysis.gaps.map(gap => ({
      description: `${gap.topic}: ${gap.description}`,
      searchQueries: gap.searchQueries,
    }));
  }

  // Phase 3: Synthesis & Report Generation
  await generateReport(input);
  await completeResearch(input);
}
```

- **Docs:** [Temporal TypeScript SDK Guide](https://docs.temporal.io/develop/typescript) | [Temporal Activity Timeouts & Retries](https://docs.temporal.io/dev-guide/typescript/foundations#activity-retries)

---

## 5. The AI Agent Intelligence Layer: Mastra & Structured Outputs

We use **Mastra** (`@mastra/core`) as the LLM agent framework. Mastra abstracts model routing, tool integration, and schema-constrained decoding.

- **Docs:** [Mastra Core Agents](https://mastra.ai/docs/agents/overview) | [Mastra Tools](https://mastra.ai/docs/agents/tools) | [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs)

### Agent Definition (`apps/worker/src/mastra/agents/research-agent.ts`)

```typescript
import { Agent } from '@mastra/core/agent';
import { researchTools } from '../../tools/index.js';

export const researchAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  instructions: `You are an elite research agent. Your job is to investigate complex research questions by planning, searching the web, fetching sources, extracting findings, and producing structured output.
  
  Guidelines:
  1. Break research into logical steps (3-7 steps ideal).
  2. Use searchWeb to discover high-relevance URLs.
  3. Use fetchPage to parse clean markdown content from pages.
  4. Assign confidence ratings: 'high' for primary/official docs, 'medium' for reputable third parties, 'low' for unverified blogs.`,
  model: 'opencode-go/hy3',
  tools: researchTools,
});
```

### Type-Safe Structured Extraction Inside Activities

Instead of relying on fragile regex or prompt pleading, the activities force strict JSON adherence using Zod schemas:

```typescript
export async function createResearchPlan(input: ResearchWorkflowInput) {
  const agent = mastra.getAgentById('research-agent');
  
  const response = await agent.generate(prompt, {
    structuredOutput: { schema: researchPlanSchema }, // Enforces schema compliance
  });

  return {
    plan: response.object, // Typed as ResearchPlan
    tokensUsed: tokensUsed(response),
  };
}
```

---

## 6. Persistence & Data Modeling: PostgreSQL + Prisma

State is split cleanly between **Orchestration History** (Temporal's internal database) and **Domain Entities** (Application database).

- **Docs:** [Prisma Schema Reference](https://www.prisma.io/docs/orm/prisma-schema/overview) | [Prisma Indexing & Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)

```prisma
// apps/api/prisma/schema.prisma

model Research {
  id           String          @id @default(cuid())
  userId       String
  question     String
  instructions String?
  status       String          @default("pending")
  workflowId   String?
  createdAt    DateTime        @default(now())
  completedAt  DateTime?
  updatedAt    DateTime        @updatedAt

  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  sources      Source[]
  findings     Finding[]
  reports      Report[]
  events       ResearchEvent[]

  @@index([userId])
}

model ResearchEvent {
  id         String   @id @default(cuid())
  sequence   Int      @default(autoincrement()) // Crucial for reliable SSE replay
  researchId String
  type       String   // e.g., 'research.source_found', 'research.gap_detected'
  step       String?
  message    String?
  metadata   Json?
  timestamp  DateTime @default(now())

  research   Research @relation(fields: [researchId], references: [id], onDelete: Cascade)

  @@index([researchId, sequence])
}

model Finding {
  id         String   @id @default(cuid())
  researchId String
  sourceId   String
  claim      String
  evidence   String?
  confidence String?  // 'high' | 'medium' | 'low'

  research   Research @relation(fields: [researchId], references: [id], onDelete: Cascade)
  source     Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@index([researchId])
}
```

---

## 7. API Gateway & Event Streaming: NestJS + Server-Sent Events (SSE)

### Why Server-Sent Events (SSE) over WebSockets?

For AI progress streaming:
1. Communication is **unidirectional** (Worker $\rightarrow$ Client).
2. SSE runs over standard **HTTP/2**, requiring no custom heartbeat frames or proxy upgrades.
3. Native browser reconnection with `EventSource` handles connection drops automatically.

- **Docs:** [NestJS Server-Sent Events](https://docs.nestjs.com/techniques/server-sent-events) | [Scalar OpenAPI Documentation](https://scalar.com/) | [RxJS Observables Guide](https://rxjs.dev/guide/observable)

### Dual-Phase SSE Delivery (Catch-up Replay + Real-time Streaming)

When a user opens or refreshes a research page, the SSE stream first flushes all historical events from PostgreSQL (using the indexed `sequence` column) before polling/streaming live events:

```typescript
// apps/api/src/research/research.service.ts
@Injectable()
export class ResearchService {
  streamEvents(userId: string, id: string): Observable<{ data: unknown }> {
    return new Observable((subscriber) => {
      let lastSequence = 0;
      let isDone = false;

      const poll = async () => {
        if (isDone) return;

        // 1. Fetch new events past lastSequence
        const events = await this.prisma.researchEvent.findMany({
          where: { researchId: id, sequence: { gt: lastSequence } },
          orderBy: { sequence: 'asc' },
        });

        for (const event of events) {
          lastSequence = event.sequence;
          subscriber.next({ data: event });
        }

        // 2. Check if research reached terminal state
        const research = await this.prisma.research.findUnique({
          where: { id },
          select: { status: true },
        });

        if (TERMINAL_STATUSES.has(research?.status ?? '')) {
          isDone = true;
          subscriber.complete();
          return;
        }

        setTimeout(poll, 1000); // Poll interval
      };

      poll();
    });
  }
}
```

---

## 8. Frontend & Interactive Experience: Next.js + Tailwind v4

### Reactive Event Consumption

The frontend connects via `EventSource` and maintains an interactive timeline alongside dynamic tabs for Sources, Evidence Findings, and Markdown Reports:

- **Docs:** [Next.js App Router Documentation](https://nextjs.org/docs/app) | [MDN EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) | [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)

```typescript
// apps/web/src/components/research-progress.tsx
useEffect(() => {
  const eventSource = new EventSource(
    `${process.env.NEXT_PUBLIC_API_URL}/api/research/${researchId}/events`
  );

  eventSource.onmessage = (event) => {
    const newEvent: ResearchEvent = JSON.parse(event.data);
    setEvents((prev) => [...prev, newEvent]);
    
    if (newEvent.type === 'research.completed') {
      eventSource.close();
      router.refresh();
    }
  };

  return () => eventSource.close();
}, [researchId]);
```

---

## 9. Infrastructure & Local Development Orchestration

A multi-service `docker-compose.yml` provides a production-identical local environment:

- **Docs:** [Temporal Docker Compose Repository](https://github.com/temporalio/docker-compose) | [Docker Compose Specification](https://docs.docker.com/compose/)

```yaml
services:
  # 1. Application PostgreSQL (port 5434 to avoid local conflicts)
  postgres:
    image: postgres:17-alpine
    ports: ["5434:5432"]
    environment:
      POSTGRES_DB: research_agent

  # 2. Dedicated Temporal State PostgreSQL (port 5433)
  temporal-postgres:
    image: postgres:17-alpine
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: temporal

  # 3. Temporal Core Cluster (Auto-setup)
  temporal:
    image: temporalio/auto-setup:1.25
    ports: ["7233:7233"]
    depends_on:
      temporal-postgres:
        condition: service_healthy

  # 4. Temporal Observability Web UI (port 8233)
  temporal-ui:
    image: temporalio/ui:latest
    ports: ["8233:8080"]
    environment:
      TEMPORAL_ADDRESS: temporal:7233
```

---

## 10. Key Architectural Lessons & Design Patterns

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DURABLE AI BEST PRACTICES                       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Determinism Rule: Workflows must only orchestrate. No direct I/O,   │
│    random numbers, or Date.now() inside the workflow function itself.  │
│                                                                        │
│ 2. Idempotent Activities: Ensure activities writing to databases can   │
│    safely execute multiple times on retry without creating duplicates. │
│                                                                        │
│ 3. Finite Budget Constraints: Always impose multi-dimensional bounds   │
│    (iteration count, token limit, source threshold, time limit).       │
│                                                                        │
│ 4. Single-Source Schemas: Share Zod schemas across the API gateway,   │
│    the LLM structured output parser, and the DB boundary.             │
│                                                                        │
│ 5. Sequence-Ordered Event Replay: Always pair real-time streams with   │
│    an incremental sequence index in DB for drop-free reconnections.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Master Reference & Curated Reading List

### Workflow Orchestration & Durability
- [Temporal.io Official Documentation](https://docs.temporal.io/) — Core concepts of workflows, activities, task queues, and workers.
- [Temporal TypeScript SDK Developer Guide](https://docs.temporal.io/develop/typescript) — Determinism constraints, proxies, signals, queries, and interceptors.
- [Temporal Failure & Retry Policies](https://docs.temporal.io/dev-guide/typescript/foundations#activity-retries) — Configuring backoff, non-retryable errors, and timeouts.
- [Temporal Observability & Web UI](https://docs.temporal.io/web-ui) — Inspecting execution history, call stacks, and activity input/output payloads.

### AI Agent Frameworks & Structured Outputs
- [Mastra AI Framework Documentation](https://mastra.ai/docs) — Agent orchestration, tools, and workflows in TypeScript.
- [Zod TypeScript Schema Validation](https://zod.dev/) — Schema declaration, transformations, and runtime validation.
- [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs) — How JSON schemas guide constrained decoding in LLMs.
- [Anthropic Tool Use (Function Calling)](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — Guide to model-driven external tool execution.

### Backend, Database & Event Streaming
- [NestJS Official Documentation](https://docs.nestjs.com/) — Controllers, dependency injection, and module lifecycle.
- [NestJS Server-Sent Events (SSE)](https://docs.nestjs.com/techniques/server-sent-events) — Reactive event streaming with RxJS Observables.
- [Prisma ORM Documentation](https://www.prisma.io/docs) — Schema modeling, migrations, client generation, and indexing strategies.
- [Scalar API Reference Docs](https://scalar.com/) — Modern OpenAPI documentation rendering.
- [MDN Server-Sent Events Guide](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — Browser `EventSource` protocol specifications.

### Frontend, React & Design Systems
- [Next.js App Router Documentation](https://nextjs.org/docs/app) — Server Components, Client Components, streaming SSR.
- [React 19 Documentation](https://react.dev/) — Latest React architecture and concurrent features.
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs) — Modern CSS-first configuration and theme engine.
