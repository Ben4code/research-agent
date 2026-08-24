import * as cheerio from 'cheerio';
import type { FetchPageInput, FetchPageOutput } from '@research-agent/shared';
import { assertSafeUrl } from './url-validation.js';

const MAX_CONTENT_LENGTH = 50_000;
const FETCH_TIMEOUT_MS = 15_000;

export async function fetchPage(input: FetchPageInput): Promise<FetchPageOutput> {
  await assertSafeUrl(input.url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(input.url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ResearchAgent/1.0; +https://github.com/research-agent)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Fetch timed out after ${FETCH_TIMEOUT_MS}ms: ${input.url}`);
    }
    throw new Error(`Fetch failed: ${input.url} — ${error}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Fetch returned ${response.status}: ${input.url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    'script, style, nav, footer, header, aside, iframe, noscript, svg, form, button, .ad, .ads, .advertisement, .sidebar, .cookie, .popup, .modal',
  ).remove();

  // Extract title
  const title =
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    input.url;

  // Try common content selectors, fall back to body
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.article',
    '.post-content',
    '#content',
    'body',
  ];

  let content = '';
  for (const selector of contentSelectors) {
    const el = $(selector).first();
    if (el.length && el.text().trim().length > 200) {
      content = el.text().trim();
      break;
    }
  }

  if (!content) {
    content = $('body').text().trim();
  }

  // Normalize whitespace
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.slice(0, MAX_CONTENT_LENGTH) + '... [truncated]';
  }

  return { url: input.url, title, content };
}
