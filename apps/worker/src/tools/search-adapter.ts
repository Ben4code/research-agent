import type { SearchWebInput, SearchWebOutput } from '@research-agent/shared';

const TAVILY_API_URL = 'https://api.tavily.com/search';

export async function searchWeb(input: SearchWebInput): Promise<SearchWebOutput> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set');
  }

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: input.query,
      max_results: input.maxResults,
      search_depth: 'basic',
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Tavily search failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };

  const results = (data.results ?? []).map((r) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    snippet: (r.content ?? '').slice(0, 500),
  }));

  return { results };
}
