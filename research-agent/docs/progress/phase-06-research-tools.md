# Phase 6 — Research Tools

**Status:** ⬜ Not Started
**Milestone:** M3 — Real Research
**Dependencies:** Phase 5 (Mastra Agent)

## Goals

Give the agent access to external information.

## Tools

### Tool 1 — Search

```ts
searchWeb(query): { results: [{ title, url, snippet }] }
```

### Tool 2 — Fetch

```ts
fetchPage(url): { url, title, content }
```

### Tool 3 — Save Finding

```ts
saveFinding({ researchId, sourceId, claim, evidence })
```

## Tasks

- [ ] Select search provider.
- [ ] Implement search adapter.
- [ ] Implement page fetching.
- [ ] Normalize page content.
- [ ] Add URL validation.
- [ ] Implement finding persistence.
- [ ] Expose tools to Mastra.
- [ ] Add tool error handling.
- [ ] Add rate limiting.

## Decisions

- **Search provider:** TBD (Tavily, Serper, Brave Search, Google Custom Search)
- **Page fetching:** Playwright or Cheerio for content extraction
- **Rate limiting:** Temporal activity rate limits + per-research budgets

## Notes

- Tools are exposed to Mastra as callable functions
- Tool execution happens inside Temporal Activities for durability
- URL validation is a security requirement (prevent SSRF)
- Page content normalization should strip scripts, nav, ads — keep main content
