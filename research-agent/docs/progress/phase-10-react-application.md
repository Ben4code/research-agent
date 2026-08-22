# Phase 10 — React Application

**Status:** 🔄 In Progress
**Milestone:** M4 — Frontend
**Started:** 2026-08-22

## Goals

Build the user-facing research experience.

## Pages

- [x] `/` — Research dashboard (landing page with CTAs)
- [ ] `/research/new` — Create research form
- [x] `/research` — Research history list
- [x] `/research/[id]` — Research detail (report + sources + findings)

## Components

| Component          | Status | File                                        |
| ------------------ | ------ | ------------------------------------------- |
| ResearchForm       | ⬜     | —                                           |
| ResearchList       | ✅     | Inline in `/research/page.tsx`              |
| ResearchProgress   | ⬜     | — (depends on Phase 9 SSE)                 |
| ResearchStep       | ⬜     | — (depends on Phase 9 SSE)                 |
| ResearchReport     | ✅     | Inline in `/research/[id]/page.tsx`        |
| SourceList         | ✅     | Inline in `/research/[id]/page.tsx`        |
| FindingList        | ✅     | Inline in `/research/[id]/page.tsx`        |
| StatusBadge        | ✅     | `src/components/status-badge.tsx`          |

## Tasks

- [ ] Build research form (`/research/new`)
- [x] Build research history (`/research`)
- [ ] Build progress UI (depends on Phase 9 — SSE events)
- [ ] Implement SSE connection (depends on Phase 9)
- [x] Build report renderer (renders report content in detail page)
- [x] Build source links (sidebar with external links in detail page)
- [ ] Add loading states (skeletons / spinners)
- [x] Add failure states (failed research shows message in detail page)
- [x] Add empty states (empty history list, no report, no sources)

## What's Done

- Home page with "Start Research" and "View History" buttons
- History page fetches `GET /api/research` server-side, renders list with status badges + dates
- Detail page fetches `GET /api/research/:id` server-side, renders:
  - Header with question, status badge, instructions, timestamps
  - Stats row (sources count, findings count, reports count)
  - Report content (2/3 width)
  - Sources sidebar with external links (1/3 width)
  - Findings with confidence indicators (color-coded)
- `StatusBadge` component maps all `ResearchStatus` values to shadcn Badge variants
- shadcn/ui components installed: button, card, input, textarea, label, badge, sonner

## What's Left

- Research form page (`/research/new`) with question + instructions inputs
- POST to API on submit, redirect to `/research/[id]`
- SSE-based progress UI (after Phase 9)
- Loading skeletons for async pages
- Markdown rendering for report content (currently plain text in `<pre>`)
- Dark mode toggle

## Decisions

- **shadcn/ui:** Uses base-ui primitives (not Radix). No `asChild` prop — use `buttonVariants()` with `<Link>` instead
- **Data fetching:** Server Components with `fetch()` and `cache: 'no-store'`
- **API URL:** `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:3001`

## Verification

- [x] `pnpm build` — Next.js build passes with all routes
- [x] Home page renders with CTA buttons
- [x] History page renders 4 seeded research projects
- [x] Detail page renders report, sources, findings for completed research
- [x] Detail page shows failure message for failed research
- [ ] Research form submission creates new research

## Files

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/research/page.tsx`
- `apps/web/src/app/research/[id]/page.tsx`
- `apps/web/src/components/status-badge.tsx`
- `apps/web/src/components/ui/` (7 shadcn components)
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/.env.local`
