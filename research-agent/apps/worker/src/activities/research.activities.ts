import { log } from '@temporalio/activity';
import { prisma } from '../db/prisma.js';
import { mastra } from '../mastra/index.js';
import { searchWeb } from '../tools/search-adapter.js';
import { fetchPage } from '../tools/fetch-adapter.js';
import {
  researchPlanSchema,
  findingsSchema,
  generatedReportSchema,
  type ResearchWorkflowInput,
  type ResearchPlan,
  type Finding,
  type GeneratedReport,
} from '@research-agent/shared';

const MAX_RESULTS_PER_QUERY = 3;
const MAX_PAGES_PER_STEP = 3;

// ── Phase 7: Full E2E pipeline ──────────────────────────────────────

export async function initializeResearch(
  input: ResearchWorkflowInput,
): Promise<void> {
  const { researchId } = input;
  log.info('Initializing research', { researchId });

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'planning' },
  });
}

export async function createResearchPlan(
  input: ResearchWorkflowInput,
): Promise<ResearchPlan> {
  const { researchId, question, instructions } = input;
  log.info('Creating research plan', { researchId, question });

  const agent = mastra.getAgentById('research-agent');

  const prompt = instructions
    ? `Research question: ${question}\n\nAdditional instructions: ${instructions}`
    : `Research question: ${question}`;

  const response = await agent.generate(prompt, {
    structuredOutput: { schema: researchPlanSchema },
  });

  const plan = response.object;
  log.info('Research plan created', {
    researchId,
    topic: plan.topic,
    stepCount: plan.steps.length,
  });

  return plan;
}

export async function performResearch(
  input: ResearchWorkflowInput,
  plan: ResearchPlan,
): Promise<Finding[]> {
  const { researchId, question } = input;

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'researching' },
  });

  const allFindings: Finding[] = [];
  const agent = mastra.getAgentById('research-agent');

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    log.info(`Researching step ${i + 1}/${plan.steps.length}`, {
      researchId,
      description: step.description,
    });

    // 1. Search for each query in this step
    const allSearchResults: { title: string; url: string; snippet: string }[] = [];
    for (const query of step.searchQueries) {
      try {
        const searchResult = await searchWeb({
          query,
          maxResults: MAX_RESULTS_PER_QUERY,
        });
        allSearchResults.push(...searchResult.results);
        log.info(`Search completed`, {
          researchId,
          query,
          resultCount: searchResult.results.length,
        });
      } catch (error) {
        log.error(`Search failed for query`, { query, error: String(error) });
      }
    }

    // Deduplicate URLs
    const seenUrls = new Set<string>();
    const uniqueResults = allSearchResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    // 2. Fetch top pages
    const pages: { url: string; title: string; content: string }[] = [];
    const pagesToFetch = uniqueResults.slice(0, MAX_PAGES_PER_STEP);

    for (const result of pagesToFetch) {
      try {
        const page = await fetchPage({ url: result.url });
        if (page.content.length > 100) {
          pages.push(page);
          log.info(`Fetched page`, {
            researchId,
            url: result.url,
            contentLength: page.content.length,
          });
        }
      } catch (error) {
        log.error(`Fetch failed`, { url: result.url, error: String(error) });
      }
    }

    if (pages.length === 0) {
      log.warn(`No pages fetched for step ${i + 1}`, { researchId });
      continue;
    }

    // 3. Extract findings using the agent
    const pageContents = pages
      .map(
        (p) =>
          `### Source: ${p.title}\nURL: ${p.url}\n\n${p.content.slice(0, 8000)}`,
      )
      .join('\n\n---\n\n');

    const extractPrompt = `You are researching: "${question}"

Research step: ${step.description}

Here are the contents of ${pages.length} web pages found for this step:

${pageContents}

Extract key findings from this content that are relevant to the research question. For each finding:
- State the claim clearly
- Include the source URL and title
- Provide supporting evidence from the content
- Assign confidence: "high" for official docs/pricing, "medium" for reputable sources, "low" for uncertain info

Only include findings that are directly relevant. Be factual — do not make up information.`;

    try {
      const extractResponse = await agent.generate(extractPrompt, {
        structuredOutput: { schema: findingsSchema },
      });

      const stepFindings = extractResponse.object.findings;
      log.info(`Findings extracted`, {
        researchId,
        step: i + 1,
        findingCount: stepFindings.length,
      });

      // 4. Persist each finding
      for (const finding of stepFindings) {
        let source = await prisma.source.findFirst({
          where: { researchId, url: finding.sourceUrl },
        });

        if (!source) {
          source = await prisma.source.create({
            data: {
              researchId,
              url: finding.sourceUrl,
              title: finding.sourceTitle,
              snippet: finding.claim.slice(0, 500),
            },
          });
        }

        await prisma.finding.create({
          data: {
            researchId,
            sourceId: source.id,
            claim: finding.claim,
            evidence: finding.evidence,
            confidence: finding.confidence,
          },
        });

        allFindings.push(finding);
      }
    } catch (error) {
      log.error(`Finding extraction failed for step ${i + 1}`, {
        researchId,
        error: String(error),
      });
    }
  }

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'analyzing' },
  });

  log.info(`Research complete`, {
    researchId,
    totalFindings: allFindings.length,
  });

  return allFindings;
}

export async function generateReport(
  input: ResearchWorkflowInput,
): Promise<GeneratedReport> {
  const { researchId, question, instructions } = input;

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'generating_report' },
  });

  const dbFindings = await prisma.finding.findMany({
    where: { researchId },
    include: {
      source: {
        select: { url: true, title: true },
      },
    },
    orderBy: { confidence: 'asc' },
  });

  log.info(`Generating report`, {
    researchId,
    findingCount: dbFindings.length,
  });

  const findingsText = dbFindings
    .map((f, i) => {
      const confidence = f.confidence ? ` [${f.confidence}]` : '';
      return `### Finding ${i + 1}${confidence}\n**Claim:** ${f.claim}\n**Source:** [${f.source.title}](${f.source.url})\n${f.evidence ? `**Evidence:** ${f.evidence}\n` : ''}`;
    })
    .join('\n\n');

  const sourcesText = dbFindings
    .map((f) => `- [${f.source.title}](${f.source.url})`)
    .join('\n');

  const prompt = `You are generating a research report for the following question:

**Question:** ${question}
${instructions ? `**Instructions:** ${instructions}` : ''}

Here are ${dbFindings.length} findings extracted from web research:

${findingsText}

## Source URLs
${sourcesText}

Generate a comprehensive, well-structured research report in Markdown. Include:
1. An executive summary
2. Detailed analysis organized by theme
3. Comparison tables where appropriate
4. Recommendations if applicable
5. All sources cited with links

The report should be informative, factual, and reference the findings above.`;

  const agent = mastra.getAgentById('research-agent');

  const response = await agent.generate(prompt, {
    structuredOutput: { schema: generatedReportSchema },
  });

  const report = response.object;

  const fullContent = `## Executive Summary\n\n${report.executiveSummary}\n\n${report.content}`;

  await prisma.report.create({
    data: {
      researchId,
      title: report.title,
      content: fullContent,
    },
  });

  log.info(`Report generated`, {
    researchId,
    title: report.title,
    contentLength: fullContent.length,
  });

  return report;
}

export async function completeResearch(
  input: ResearchWorkflowInput,
): Promise<void> {
  const { researchId } = input;
  log.info('Completing research', { researchId });

  await prisma.research.update({
    where: { id: researchId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });
}
