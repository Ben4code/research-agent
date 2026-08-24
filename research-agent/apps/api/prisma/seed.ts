import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const user = await prisma.user.upsert({
    where: { id: 'demo-user-id' },
    update: {},
    create: {
      id: 'demo-user-id',
      email: 'demo@research-agent.dev',
      name: 'Demo Researcher',
    },
  });

  const day = 1000 * 60 * 60 * 24;

  const r1 = await prisma.research.create({
    data: {
      userId: user.id,
      question:
        'Compare the top five payment processors available to Canadian SaaS companies',
      instructions:
        'Focus on pricing, APIs, payment methods, and developer experience.',
      status: 'completed',
      workflowId: 'wf_payment_processors_ca',
      createdAt: new Date(Date.now() - day * 7),
      completedAt: new Date(Date.now() - day * 6),
    },
  });

  const r2 = await prisma.research.create({
    data: {
      userId: user.id,
      question:
        'Compare Temporal, BullMQ, and Inngest for a NestJS application',
      instructions:
        'Focus on durability, developer experience, and pricing.',
      status: 'completed',
      workflowId: 'wf_temporal_vs_bullmq_inngest',
      createdAt: new Date(Date.now() - day * 4),
      completedAt: new Date(Date.now() - day * 3),
    },
  });

  const r3 = await prisma.research.create({
    data: {
      userId: user.id,
      question:
        'React state management in 2026: Context vs Zustand vs Jotai',
      status: 'researching',
      workflowId: 'wf_react_state_2026',
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  });

  const r4 = await prisma.research.create({
    data: {
      userId: user.id,
      question:
        'Canadian AI regulations and their impact on SaaS startups',
      instructions:
        'Cover AIDA, voluntary codes, and provincial frameworks.',
      status: 'failed',
      workflowId: 'wf_canadian_ai_regulations',
      createdAt: new Date(Date.now() - day * 2),
    },
  });

  // ── Progress events (Phase 9) ─────────────────────────────────────

  const base = Date.now();

  await prisma.researchEvent.createMany({
    data: [
      {
        researchId: r1.id,
        type: 'research.started',
        step: 'initialized',
        message: 'Research workflow started',
        timestamp: new Date(base - day * 7),
      },
      {
        researchId: r1.id,
        type: 'research.planning',
        step: 'planning',
        message: 'Planning complete — 5 research steps',
        metadata: { topic: 'payment processors', stepCount: 5 },
        timestamp: new Date(base - day * 7 + 1000 * 30),
      },
      {
        researchId: r1.id,
        type: 'research.searching',
        step: 'searching',
        message: 'Researching 5 tasks',
        metadata: { taskCount: 5 },
        timestamp: new Date(base - day * 7 + 1000 * 60),
      },
      {
        researchId: r1.id,
        type: 'research.source_found',
        step: 'source_found',
        message: 'Source found: Stripe Pricing',
        metadata: { url: 'https://stripe.com/pricing', sourceCount: 1 },
        timestamp: new Date(base - day * 7 + 1000 * 90),
      },
      {
        researchId: r1.id,
        type: 'research.source_found',
        step: 'source_found',
        message: 'Source found: Stripe API Documentation',
        metadata: { url: 'https://stripe.com/docs/api', sourceCount: 2 },
        timestamp: new Date(base - day * 7 + 1000 * 120),
      },
      {
        researchId: r1.id,
        type: 'research.analyzing',
        step: 'analyzing',
        message: 'Analyzing 3 findings from 2 sources',
        metadata: { findingCount: 3, sourceCount: 2 },
        timestamp: new Date(base - day * 7 + 1000 * 180),
      },
      {
        researchId: r1.id,
        type: 'research.analyzing',
        step: 'gap_analysis',
        message: 'Findings are complete — no important gaps',
        metadata: { isComplete: true, findingCount: 3 },
        timestamp: new Date(base - day * 7 + 1000 * 240),
      },
      {
        researchId: r1.id,
        type: 'research.generating_report',
        step: 'generating_report',
        message: 'Generating the research report',
        timestamp: new Date(base - day * 7 + 1000 * 300),
      },
      {
        researchId: r1.id,
        type: 'research.completed',
        step: 'completed',
        message: 'Research completed',
        timestamp: new Date(base - day * 6),
      },
      {
        researchId: r3.id,
        type: 'research.started',
        step: 'initialized',
        message: 'Research workflow started',
        timestamp: new Date(base - 1000 * 60 * 30),
      },
      {
        researchId: r3.id,
        type: 'research.planning',
        step: 'planning',
        message: 'Planning complete — 4 research steps',
        metadata: { topic: 'react state management', stepCount: 4 },
        timestamp: new Date(base - 1000 * 60 * 29),
      },
      {
        researchId: r3.id,
        type: 'research.searching',
        step: 'searching',
        message: 'Researching 4 tasks',
        metadata: { taskCount: 4 },
        timestamp: new Date(base - 1000 * 60 * 28),
      },
      {
        researchId: r4.id,
        type: 'research.started',
        step: 'initialized',
        message: 'Research workflow started',
        timestamp: new Date(base - day * 2),
      },
      {
        researchId: r4.id,
        type: 'research.failed',
        step: 'failed',
        message: 'Research failed: TAVILY_API_KEY is not set',
        metadata: { error: 'TAVILY_API_KEY is not set' },
        timestamp: new Date(base - day * 2 + 1000 * 30),
      },
    ],
  });

  const s1 = await prisma.source.create({
    data: {
      researchId: r1.id,
      url: 'https://stripe.com/pricing',
      title: 'Stripe Pricing',
      snippet:
        'Stripe charges 2.9% + 30c per successful card charge.',
      content:
        'Stripe pricing for Canadian accounts: 2.9% + 30c per transaction. No monthly fees. Additional fees for international cards, currency conversion, and disputes.',
      retrievedAt: new Date(Date.now() - day * 7),
    },
  });

  const s2 = await prisma.source.create({
    data: {
      researchId: r1.id,
      url: 'https://stripe.com/docs/api',
      title: 'Stripe API Documentation',
      snippet: 'RESTful API with official SDKs in 11 languages.',
      content:
        'Stripe provides a RESTful API with official SDKs in Node, Python, Ruby, PHP, Java, Go, .NET, and more. Webhooks for event-driven integration.',
      retrievedAt: new Date(Date.now() - day * 7),
    },
  });

  await prisma.source.create({
    data: {
      researchId: r1.id,
      url: 'https://www.adyen.com/pricing',
      title: 'Adyen Pricing',
      snippet: 'Interchange-plus pricing model for merchants.',
      content:
        'Adyen uses interchange-plus pricing. For Canadian cards, typical rate is 1.65% + 10c for domestic Visa/Mastercard.',
      retrievedAt: new Date(Date.now() - day * 7),
    },
  });

  await prisma.source.create({
    data: {
      researchId: r2.id,
      url: 'https://docs.temporal.io/typescript',
      title: 'Temporal TypeScript SDK Documentation',
      snippet: 'Durable execution with workflows and activities.',
      content:
        'Temporal TypeScript SDK provides durable workflow execution. Workflows are deterministic, side effects go in activities. Supports signals, queries, child workflows.',
      retrievedAt: new Date(Date.now() - day * 4),
    },
  });

  await prisma.source.create({
    data: {
      researchId: r2.id,
      url: 'https://docs.bullmq.io',
      title: 'BullMQ Documentation',
      snippet: 'Redis-based queue for Node.js.',
      content:
        'BullMQ is a Redis-based distributed queue for Node.js. Supports delayed jobs, retries, priorities, rate limiting, and job dependencies.',
      retrievedAt: new Date(Date.now() - day * 4),
    },
  });

  await prisma.source.create({
    data: {
      researchId: r2.id,
      url: 'https://www.inngest.com/docs',
      title: 'Inngest Documentation',
      snippet: 'Event-driven durable functions.',
      content:
        'Inngest provides event-driven durable functions with automatic retries, concurrency control, and step functions. Serverless-friendly.',
      retrievedAt: new Date(Date.now() - day * 4),
    },
  });

  await prisma.finding.createMany({
    data: [
      {
        researchId: r1.id,
        sourceId: s1.id,
        claim: 'Stripe charges 2.9% + 30c per transaction for Canadian cards',
        evidence: 'Listed on stripe.com/pricing for Canadian accounts',
        confidence: 'high',
      },
      {
        researchId: r1.id,
        sourceId: s2.id,
        claim: 'Stripe offers official SDKs in 11+ languages including Node.js',
        evidence: 'Documented at stripe.com/docs/api',
        confidence: 'high',
      },
      {
        researchId: r1.id,
        sourceId: s1.id,
        claim: 'Stripe supports recurring billing via Billing product',
        evidence: 'Stripe Billing is a separate but integrated product',
        confidence: 'high',
      },
    ],
  });

  await prisma.report.create({
    data: {
      researchId: r1.id,
      title: 'Payment Processors for Canadian SaaS Companies',
      content: `# Payment Processors for Canadian SaaS Companies

## Executive Summary

This report compares the top payment processors available to Canadian SaaS companies. We evaluated pricing, API quality, supported payment methods, and developer experience across Stripe, Adyen, Square, Moneris, and Braintree.

## Comparison

| Provider | Pricing | Payment Methods | API Quality |
|----------|---------|-----------------|-------------|
| Stripe   | 2.9% + 30c | Cards, Apple Pay, Google Pay | Excellent |
| Adyen    | Interchange+ | Cards, local methods | Very Good |
| Square   | 2.6% + 10c | Cards, Square Pay | Good |
| Moneris  | Custom | Cards, Interac | Fair |
| Braintree| 2.9% + 30c | Cards, PayPal, Venmo | Good |

## Stripe

Stripe offers the best developer experience with comprehensive SDKs, excellent documentation, and a generous free tier. The 2.9% + 30c rate is competitive for Canadian cards.

## Adyen

Adyen uses interchange-plus pricing which can be cheaper at scale. Their unified platform supports a wide range of local payment methods.

## Recommendations

For most Canadian SaaS companies, **Stripe** is the recommended choice due to its superior developer experience and competitive pricing. For high-volume merchants, **Adyen** may offer cost savings through interchange-plus pricing.

## Sources

1. [Stripe Pricing](https://stripe.com/pricing)
2. [Stripe API Documentation](https://stripe.com/docs/api)
3. [Adyen Pricing](https://www.adyen.com/pricing)`,
    },
  });

  await prisma.report.create({
    data: {
      researchId: r2.id,
      title:
        'Temporal vs BullMQ vs Inngest for NestJS Applications',
      content: `# Temporal vs BullMQ vs Inngest for NestJS

## Executive Summary

This report compares three durable execution solutions for NestJS applications: Temporal, BullMQ, and Inngest. Each has distinct trade-offs in terms of durability, developer experience, and operational complexity.

## Comparison

| Feature | Temporal | BullMQ | Inngest |
|---------|----------|--------|---------|
| Durability | Strong | Moderate | Strong |
| Self-hosted | Yes | Yes (Redis) | No |
| Learning curve | Steep | Low | Low |
| TypeScript SDK | Yes | Yes | Yes |
| NestJS integration | Via client | Via queue | Via handler |

## Temporal

Temporal provides the strongest durability guarantees. Workflows survive worker crashes, deployments, and long-running operations. The TypeScript SDK is mature with excellent type safety.

## BullMQ

BullMQ is the simplest option for basic job queues. It runs on Redis and integrates well with NestJS via @nestjs/bullmq. However, it lacks the workflow orchestration features of Temporal.

## Inngest

Inngest offers a serverless-friendly approach with built-in retries and step functions. No infrastructure to manage, but you are locked into their platform.

## Recommendation

For applications requiring durable, long-running workflows with complex orchestration, **Temporal** is the best choice. For simple background jobs, **BullMQ** is sufficient. For serverless deployments without infrastructure management, **Inngest** is ideal.

## Sources

1. [Temporal TypeScript SDK](https://docs.temporal.io/typescript)
2. [BullMQ Documentation](https://docs.bullmq.io)
3. [Inngest Documentation](https://www.inngest.com/docs)`,
    },
  });

  console.log('Seed complete!');
  console.log(`  User: ${user.email}`);
  console.log(`  Research: 4 projects (2 completed, 1 researching, 1 failed)`);
  console.log(`  Sources: 6, Findings: 3, Reports: 2`);
  console.log(`  Events: 14`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
