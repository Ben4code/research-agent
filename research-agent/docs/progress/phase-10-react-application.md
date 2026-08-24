# Phase 10 — React Application

**Status:** ✅ Complete
**Milestone:** M4 — Frontend
**Dependencies:** Phase 9 (Progress Events)

## Goals

Build the user-facing research experience.

## Pages

- [x] `/` — Research dashboard (landing page with CTAs)
- [x] `/research/new` — Create research form
- [x] `/research` — Research history list
- [x] `/research/[id]` — Research detail (progress + report + sources + findings)

## Components

| Component          | Status | File                                        |
| ------------------ | ------ | ------------------------------------------- |
| ResearchForm       | ✅     | Inline in `/research/new/page.tsx`          |
| ResearchList       | ✅     | Inline in `/research/page.tsx`              |
| ResearchProgress   | ✅     | `src/components/research-progress.tsx`      |
| ResearchStep       | ✅     | Timeline items in `research-progress.tsx`   |
| ResearchReport     | ✅     | `ReportsPanel` in `src/components/stats-tabs.tsx` |
| SourceList         | ✅     | `SourcesPanel` in `stats-tabs.tsx`          |
| FindingList        | ✅     | `FindingsPanel` in `stats-tabs.tsx`         |
| StatusBadge        | ✅     | `src/components/status-badge.tsx`           |

## Tasks

- [x] Build research form (`/research/new`)
- [x] Build research history (`/research`)
- [x] Build progress UI (`research-progress.tsx` — SSE timeline)
- [x] Implement SSE connection (`EventSource` + per-type listeners)
- [x] Build report renderer (ReactMarkdown + prose-calcite theme)
- [x] Build source links (external link cards)
- [x] Add loading states (`loading.tsx` skeletons for history + detail)
- [x] Add failure states (failed research shows message in detail page)
- [x] Add empty states (empty history list, no report, no sources, no findings)

## What's Done

- Landing page with "Start Research" and "View History" CTAs + GSAP animations
- New research form (`/research/new`) posts to the API and redirects to detail
- History page (`/research`) lists projects server-side with status badges + dates
- Detail page (`/research/[id]`) renders:
  - Live `ResearchProgress` timeline for non-terminal statuses (SSE-driven,
    auto-refreshes on completion/failure)
  - Tabbed full-width panels: Reports (Markdown report), Sources (grid of
    external links), Findings (claims with confidence chips)
- Loading skeletons for `/research` and `/research/[id]`
- Calcite design system: charcoal/light/orange/peach tokens, Roboto + Roboto Mono

## Decisions

- **shadcn/ui:** Uses base-ui primitives (not Radix). No `asChild` prop — use `buttonVariants()` with `<Link>` instead
- **Data fetching:** Server Components with `fetch()` and `cache: 'no-store'`
- **API URL:** `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:3001`
- **SSE:** client attaches one listener per event type (named SSE events aren't
  dispatched as the default `message` event)

## Verification

- [x] `pnpm build` — Next.js build passes with all routes
- [x] Home page renders with CTA buttons
- [x] History page renders seeded research projects
- [x] Detail page renders report, sources, findings for completed research
- [x] Detail page shows failure message for failed research
- [x] Research form submission creates new research
- [x] Live progress timeline streams events + refreshes on completion
- [x] Loading skeletons render during navigation
- [x] Contrast + overflow checks pass (light + dark, desktop + mobile)
- [x] IMPECCABLE detector clean

## Files

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/research/page.tsx`
- `apps/web/src/app/research/new/page.tsx`
- `apps/web/src/app/research/[id]/page.tsx`
- `apps/web/src/app/research/loading.tsx`
- `apps/web/src/app/research/[id]/loading.tsx`
- `apps/web/src/components/research-progress.tsx`
- `apps/web/src/components/stats-tabs.tsx`
- `apps/web/src/components/status-badge.tsx`
- `apps/web/src/components/ui/` (shadcn components)
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/.env.local`