import { createTool } from '@mastra/core/tools';
import {
  searchWebInputSchema,
  searchWebOutputSchema,
  fetchPageInputSchema,
  fetchPageOutputSchema,
  saveFindingInputSchema,
  saveFindingOutputSchema,
} from '@research-agent/shared';
import { searchWeb } from './search-adapter.js';
import { fetchPage } from './fetch-adapter.js';
import { prisma } from '../db/prisma.js';
import { log } from '@temporalio/activity';

export const searchWebTool = createTool({
  id: 'search-web',
  description:
    'Search the web for information. Returns a list of results with title, URL, and snippet.',
  inputSchema: searchWebInputSchema,
  outputSchema: searchWebOutputSchema,
  execute: async ({ query, maxResults }) => {
    log.info('Tool: searchWeb', { query, maxResults });
    try {
      return await searchWeb({ query, maxResults });
    } catch (error) {
      log.error('Tool: searchWeb failed', { query, error: String(error) });
      return { results: [] };
    }
  },
});

export const fetchPageTool = createTool({
  id: 'fetch-page',
  description:
    'Fetch a web page and return its normalized text content. Use this to read the full content of a search result.',
  inputSchema: fetchPageInputSchema,
  outputSchema: fetchPageOutputSchema,
  execute: async ({ url }) => {
    log.info('Tool: fetchPage', { url });
    try {
      return await fetchPage({ url });
    } catch (error) {
      log.error('Tool: fetchPage failed', { url, error: String(error) });
      return { url, title: url, content: '' };
    }
  },
});

export const saveFindingTool = createTool({
  id: 'save-finding',
  description:
    'Save a structured finding extracted from a source. Use this after analyzing page content to record a claim with its evidence and confidence level.',
  inputSchema: saveFindingInputSchema,
  outputSchema: saveFindingOutputSchema,
  execute: async ({
    researchId,
    sourceUrl,
    sourceTitle,
    claim,
    evidence,
    confidence,
  }) => {
    log.info('Tool: saveFinding', { researchId, sourceUrl, claim: claim.slice(0, 80) });

    let source = await prisma.source.findFirst({
      where: { researchId, url: sourceUrl },
    });

    if (!source) {
      source = await prisma.source.create({
        data: {
          researchId,
          url: sourceUrl,
          title: sourceTitle,
        },
      });
    }

    const finding = await prisma.finding.create({
      data: {
        researchId,
        sourceId: source.id,
        claim,
        evidence,
        confidence,
      },
    });

    return { findingId: finding.id, sourceId: source.id };
  },
});

export const researchTools = {
  searchWeb: searchWebTool,
  fetchPage: fetchPageTool,
  saveFinding: saveFindingTool,
};
