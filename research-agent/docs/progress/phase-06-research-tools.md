# Phase 6 — Research Tools

**Status:** ✅ Complete (live tool test pending Tavily key)
**Milestone:** M3 — Real Research
**Dependencies:** Phase 5 (Mastra Agent)
**Started:** 2026-08-22
**Completed:** 2026-08-22

## Goals

Give the agent access to external information.

## Tools

### Tool 1 — Search (`searchWeb`)

```ts
searchWeb({ query, maxResults }) → { results: [{ title, url, snippet }] }
```

- Provider: **Tavily** (AI-optimized search API)
- Endpoint: `https://api.tavily.com/search`
- Auth: `TAVILY_API_KEY` env var
- Returns up to 10 results per query with title, URL, and 500-char snippet

### Tool 2 — Fetch (`fetchPage`)

```ts
fetchPage({ url }) → { url, title, content }
```

- Uses native `fetch()` with 15s timeout
- Content extraction via **Cheerio** (server-side jQuery)
- Strips: scripts, styles, nav, footer, ads, sidebars, modals, cookies
- Tries content selectors in order: `article`, `main`, `[role=main]`, `.content`, `.post-content`, `body`
- Normalizes whitespace, truncates at 50K chars
- URL validation + DNS resolution check (SSRF prevention)

### Tool 3 — Save Finding (`saveFinding`)

```ts
saveFinding({ researchId, sourceUrl, sourceTitle, claim, evidence, confidence })
  → { findingId, sourceId }
```

- Persists source to `sources` table (deduplicates by URL within research)
- Persists finding to `findings` table with confidence level
- Links finding to source via `sourceId`

## Tasks

- [x] Select search provider — Tavily
- [x] Implement search adapter (`search-adapter.ts`)
- [x] Implement page fetching (`fetch-adapter.ts`)
- [x] Normalize page content (Cheerio-based extraction)
- [x] Add URL validation (SSRF prevention — `url-validation.ts`)
- [x] Implement finding persistence (`saveFinding` tool)
- [x] Expose tools to Mastra (`createTool()` with Zod input/output schemas)
- [x] Add tool error handling (try/catch in each tool's `execute()`)
- [ ] Add rate limiting (deferred — Temporal activity rate limits + per-research budgets)
- [x] Add TAVILY_API_KEY to worker .env

## Decisions

### Search provider: Tavily

- AI-optimized search, returns clean content snippets
- Free tier: 1,000 searches/month
- Simple POST API with Bearer auth
- Returns `results[]` with `title`, `url`, `content` (mapped to `snippet`)

### Page fetching: Cheerio (not Playwright)

- Cheerio is lightweight, no browser needed, fast
- Sufficient for static content (docs, pricing pages, articles)
- Playwright can be added later for JS-rendered pages
- 15s timeout with AbortController
- User-Agent set to identify the bot

### URL validation / SSRF prevention

- Blocks: localhost, 127.0.0.1, 0.0.0.0, ::1, machine hostname
- Blocks: private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x, 100.64-127.x)
- Blocks: `.local` and `.internal` TLDs
- DNS resolution check: resolves hostname and verifies no private IPs
- Only http/https protocols allowed

### Tool architecture

```
packages/shared/src/schemas.ts
  └── Zod schemas for tool inputs/outputs (shared with frontend)

apps/worker/src/tools/
  ├── url-validation.ts    ← SSRF prevention
  ├── search-adapter.ts    ← Tavily API client
  ├── fetch-adapter.ts     ← Cheerio content extraction
  └── index.ts             ← createTool() wrappers for Mastra

apps/worker/src/mastra/agents/research-agent.ts
  └── Agent configured with tools: { searchWeb, fetchPage, saveFinding }
```

Tools are exposed to the agent via `createTool()` from `@mastra/core/tools`. Each tool has:
- `id` — unique identifier
- `description` — tells the LLM what the tool does
- `inputSchema` — Zod schema (validated before execution)
- `outputSchema` — Zod schema (validated after execution)
- `execute()` — the actual implementation with error handling

### Error handling

Each tool wraps its `execute()` in try/catch:
- `searchWeb` → returns `{ results: [] }` on failure (graceful degradation)
- `fetchPage` → returns `{ url, title: url, content: '' }` on failure (empty content)
- `saveFinding` → throws (finding loss is not acceptable)
- All errors are logged via `@temporalio/activity` `log`

## What's Done

- All 3 tools implemented and exposed to the Mastra agent
- Agent instructions updated to describe tool usage
- Tool schemas in shared package (Zod — single source of truth for API + frontend + worker)
- URL validation with SSRF prevention
- Worker starts and reaches RUNNING with all tools loaded
- All typechecks pass (4 packages)
- All 13 tests pass (1 unit + 12 E2E)

## What's Left for Phase 7

- Wire tools into the workflow activities (search → fetch → extract → save)
- Execute the full pipeline: plan → search per step → fetch sources → extract findings → generate report
- Persist sources and findings during workflow execution
- Generate real report from collected findings
- Rate limiting (deferred)

## Verification

- [x] `pnpm typecheck` — all 4 packages pass
- [x] `pnpm test` — 1 unit test pass
- [x] `pnpm test:e2e` — 12 E2E tests pass
- [x] Worker starts with all tools loaded — reaches RUNNING state
- [ ] Live tool test with Tavily key (user will test in Phase 7 E2E)

## Files

- `apps/worker/src/tools/url-validation.ts` — SSRF prevention (IP blocking, DNS check)
- `apps/worker/src/tools/search-adapter.ts` — Tavily API client
- `apps/worker/src/tools/fetch-adapter.ts` — Cheerio page fetch + content normalization
- `apps/worker/src/tools/index.ts` — 3 Mastra tools via `createTool()`
- `apps/worker/src/mastra/agents/research-agent.ts` — agent with tools attached
- `apps/worker/.env` — `TAVILY_API_KEY` added
- `packages/shared/src/schemas.ts` — tool input/output Zod schemas
