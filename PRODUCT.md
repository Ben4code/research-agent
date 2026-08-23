# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui + Base UI, NestJS API, Temporal worker, Mastra agent, PostgreSQL + Prisma.

## Users

Individuals who need moderately complex research done well: developers comparing technologies, product managers and founders researching markets and competitors, analysts and students investigating industries. The job is getting a reliable, structured, source-backed answer without manually reading every source.

## Product Purpose

Research Agent turns a complex question into a structured, cited report. An AI agent plans the research, searches the live web, fetches sources, extracts findings, identifies gaps, and writes it all up — executed as a durable Temporal workflow so it survives crashes, restarts, deployments, and a closed browser.

## Positioning

Durable research you can trust. Traditional chat gives an answer; Research Agent gives a citable investigation. "Mastra decides what to do. Temporal makes sure it gets done reliably." Every claim traces to a real URL with a confidence level.

## Operating Context

Users submit a question (with optional instructions), watch a live progress feed (planning, searching, fetching, analyzing, generating), and return later to find the workflow finished. They reopen a research project to read the Markdown report, browse collected sources, and inspect findings linked to their source URLs. Research history persists.

## Capabilities and Constraints

- Research statuses: pending, planning, researching, analyzing, generating_report, completed, failed, waiting_for_user.
- MVP has no authentication, no team collaboration, no scheduled research, no report export; research is single-user today.
- Frontend renders Markdown reports and links findings/sources to external URLs. No hallucinated claims by design — findings are grounded in fetched sources.

## Brand Commitments

Name: Research Agent. Identity direction: the **Calcite** design system — a warm mineral palette defined in `research-agent/docs/calcite_style_guide.md` (Calcite Light `#DDDCDB`, Calcite Orange `#FD7B41`, Calcite Peach `#EDBF9B`, Calcite Charcoal `#3C4044`), with the contrast rules it documents (dark charcoal text on orange; never white on orange). Preserve product truth, content, and function; the old purple-neutral look is replaced, not polished.

## Evidence on Hand

- Product truth: `research-agent/docs/PRD.md` (full requirements), `research-agent/docs/Goal.md`, `research-agent/docs/Plan.md`.
- Incumbent UI: `research-agent/apps/web/src/app/*` (landing, history, new research, detail) and `research-agent/apps/web/src/components/*`.
- Visual authority: `research-agent/docs/calcite_style_guide.md`.
- No real customer testimonials, logos, or demo media exist; do not fabricate them.

## Product Principles

1. Research is a durable workflow, not a single LLM call — it survives the user walking away.
2. Trust is the product: every finding cites a source; confidence levels are surfaced honestly.
3. Live progress keeps the user oriented even when the work is long-running.
4. The interface stays an Operate/Read tool for most surfaces: scanability and real usage outrank decoration.

## Accessibility & Inclusion

Follow the contrast matrix in `research-agent/docs/calcite_style_guide.md` (AAA for body text on light neutral; AA or better for colored pairings; never white text on brand orange).