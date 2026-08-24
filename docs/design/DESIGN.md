# Design System

<!-- impeccable:design-schema 1 -->

This document records the **Calcite** visual world as built in `apps/web`. Ground truth is the shipped code; this file describes it. Derived from the Calcite style guide in `research-agent/docs/calcite_style_guide.md`.

## World

Warm mineral palette built for a durable-research tool: trust is demonstrated by showing the work, not by hype. Charcoal ink on a warm light ground carries all reading surfaces; Calcite Orange is reserved for the single primary action and the live/active signal; Calcite Peach softens secondary surfaces and highlights.

## Color

| Token | Light | Dark | Role |
|---|---|---|---|
| `--calcite-charcoal` | `#3C4044` | `#3C4044` | Ink, headings, body text; dark-mode canvas |
| `--calcite-light` | `#DDDCDB` | `#DDDCDB` | Muted panels, hairlines, borders |
| `--calcite-orange` | `#FD7B41` | `#FD7B41` | Primary action, active state, brand mark |
| `--calcite-peach` | `#EDBF9B` | `oklch(0.42 0.03 50)` | Soft surfaces, icon tiles, highlights |

Functional mapping (Tailwind v4 `@theme inline`, in `apps/web/src/app/globals.css`):

- `--background` warm white `oklch(0.99 0.004 60)` (light) / charcoal (dark)
- `--foreground` calcite-charcoal (light) / calcite-light (dark)
- `--primary` calcite-orange; `--primary-foreground` deep charcoal `oklch(0.22 0.012 254.5)` — **dark text on orange, never white** (white-on-orange fails contrast)
- `--secondary` calcite-peach; `--secondary-foreground` charcoal
- `--muted` calcite-light; `--muted-foreground` `oklch(0.45 0.015 60)`
- `--ring` calcite-orange; `--border`/`--input` calcite-light
- `--brand`/`--brand-soft`/`--brand-foreground` mapped to orange/peach/deep-charcoal
- `--radius` `0.75rem`
- Selection: peach bg, charcoal text. Scrollbars: calcite-light thumb.

## Typography

**Roboto** family (self-hosted via `next/font/google`, `display: swap` with metric-compatible fallback to avoid reflow). `--font-sans`/`--font-heading` = Roboto (300–900 loaded); `--font-mono` = Roboto Mono (terminal mock, mono labels). Body floor 16px (`text-base`), `optimizeLegibility` + `cv11`/`ss01` features on. Tabular numerals for data counts.

Role scale (verified in render):

| Role | Face / weight | Size / tracking |
|---|---|---|
| Display (hero H1) | Roboto 900 | `clamp(2.75rem, 8vw, 5.5rem)` / −0.03em |
| Section (H2) | Roboto 900 | 36px (sm 48px) / −0.02em |
| Card title (H3) | Roboto 700 | 16px (step 20px) / −0.01em |
| Page title (Operate/Read) | Roboto 900 | 30px / −0.02em |
| Body | Roboto 400 | 16–20px, `leading-relaxed` |
| Meta / labels | Roboto 500 | 14px, `tracking-widest` uppercase |
| Mono / terminal | Roboto Mono | 12px |

Measure: prose held to 45–75ch (hero 56ch, section intro 65ch); card text in the 3-col grid is a dense role at ~42ch. No gradient text, headings use `text-balance`.

## Components

- **Button** (shadcn, `components/ui/button.tsx`): primary = orange bg, deep-charcoal text; outline = calcite-light border; secondary = peach bg, charcoal text. Pills (`rounded-full`) for CTAs.
- **Badge** (shadcn): status badge maps pending→outline, in-flight→secondary (peach), completed→default (orange, dark text), failed→destructive.
- **Card** (shadcn): `bg-card` warm white, calcite-light border, `rounded-2xl`, soft offset shadows (`shadow-lg shadow-calcite-orange/5`) on hover with `-translate-y-0.5`.
- **Logo mark**: `bg-calcite-orange` rounded square, `Sparkles` icon in deep-charcoal (`text-brand-foreground`).
- **Confidence chips** (detail page): high → charcoal bg / light text; medium → peach/60; low → muted.
- **Terminal mock** (landing hero): charcoal header bar, orange/peach/light traffic dots, mono step labels, done steps struck through with charcoal check.

## Surfaces

- **Landing** (`app/page.tsx`, mode Persuade): sticky nav, centered hero with peach-marker highlight under the promise line (no kicker/eyebrow), dotted ground texture, stack strip, features grid, how-it-works steps with orange numbered chips, full-bleed charcoal CTA + footer.
- **History** (`app/research/page.tsx`, mode Operate): list rows as cards, status badge + date, hover arrow affordance, empty state.
- **New research** (`app/research/new/page.tsx`, mode Operate): single form card, orange focus ring on textareas, primary submit pill.
- **Detail** (`app/research/[id]/page.tsx`, mode Read): stat cards with peach icon tiles, Markdown report in prose, source cards and findings in sidebar.

## Direction contract

Carried in a `<meta name="impeccable-direction">` tag in the root layout (Next.js strips HTML comments in production; the meta survives for audit).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.