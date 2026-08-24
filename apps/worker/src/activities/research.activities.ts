import { log } from '@temporalio/activity';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { mastra } from '../mastra/index.js';
import { searchWeb } from '../tools/search-adapter.js';
import { fetchPage } from '../tools/fetch-adapter.js';
import {
  researchPlanSchema,
  findingsSchema,
  generatedReportSchema,
  gapAnalysisSchema,
  type ResearchWorkflowInput,
  type ResearchPlan,
  type Finding,
  type GeneratedReport,
  type ResearchTask,
  type GapAnalysis,
  type ResearchEventType,
} from '@research-agent/shared';

const MAX_RESULTS_PER_QUERY = 3;
const MAX_PAGES_PER_STEP = 3;

// ── Event publishing (Phase 9 — progress events) ────────────────────

async function publishEvent(
  researchId: string,
  type: ResearchEventType,
  opts: { step?: string; message?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await prisma.researchEvent.create({
      data: {
        researchId,
        type,
        step: opts.step,
        message: opts.message,
        metadata: opts.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    log.warn('Failed to publish research event', {
      researchId,
      type,
      error: String(error),
    });
  }
}

function tokensUsed(response: {
  totalUsage?: { totalTokens?: number };
  usage?: { totalTokens?: number };
}): number {
  return (
    response.totalUsage?.totalTokens ??
    response.usage?.totalTokens ??
    0
  );
}

// ── Phase 8: Iterative research with gap detection ─────────────────

export async function initializeResearch(
  input: ResearchWorkflowInput,
): Promise<void> {
  const { researchId } = input;
  log.info('Initializing research', { researchId });

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'planning' },
  });

  await publishEvent(researchId, 'research.started', {
    step: 'initialized',
    message: 'Research workflow started',
  });
}

export async function createResearchPlan(
  input: ResearchWorkflowInput,
): Promise<{ plan: ResearchPlan; tokensUsed: number }> {
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

  await publishEvent(researchId, 'research.planning', {
    step: 'planning',
    message: `Planning complete — ${plan.steps.length} research steps`,
    metadata: {
      topic: plan.topic,
      stepCount: plan.steps.length,
      steps: plan.steps.map((s) => s.description),
    },
  });

  return { plan, tokensUsed: tokensUsed(response) };
}

export async function performResearch(
  input: ResearchWorkflowInput,
  tasks: ResearchTask[],
  maxSources: number,
): Promise<{ findings: Finding[]; sources: string[]; tokensUsed: number }> {
  const { researchId, question } = input;

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'researching' },
  });

  await publishEvent(researchId, 'research.searching', {
    step: 'searching',
    message: `Researching ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
    metadata: { taskCount: tasks.length },
  });

  const allFindings: Finding[] = [];
  const sourceUrls: string[] = [];
  let totalTokens = 0;
  const agent = mastra.getAgentById('research-agent');

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (sourceUrls.length >= maxSources) {
      log.warn('Source budget reached, stopping research early', {
        researchId,
        maxSources,
      });
      break;
    }

    log.info(`Researching task ${i + 1}/${tasks.length}`, {
      researchId,
      description: task.description,
    });

    await publishEvent(researchId, 'research.searching', {
      step: 'searching',
      message: `Task ${i + 1}/${tasks.length}: ${task.description}`,
      metadata: { taskIndex: i + 1, taskCount: tasks.length },
    });

    // 1. Search for each query in this task
    const allSearchResults: { title: string; url: string; snippet: string }[] = [];
    for (const query of task.searchQueries) {
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

    // Deduplicate URLs (also skipping ones already used as sources)
    const seenUrls = new Set<string>(sourceUrls);
    const uniqueResults = allSearchResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    // 2. Fetch top pages
    const pages: { url: string; title: string; content: string }[] = [];
    const remainingBudget = maxSources - sourceUrls.length;
    const pagesToFetch = uniqueResults.slice(0, Math.min(MAX_PAGES_PER_STEP, remainingBudget));

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
      log.warn(`No pages fetched for task ${i + 1}`, { researchId });
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

Research task: ${task.description}

Here are the contents of ${pages.length} web pages found for this task:

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
      totalTokens += tokensUsed(extractResponse);

      const stepFindings = extractResponse.object.findings;
      log.info(`Findings extracted`, {
        researchId,
        task: i + 1,
        findingCount: stepFindings.length,
      });

      // 4. Persist each finding
      for (const finding of stepFindings) {
        if (sourceUrls.length >= maxSources) {
          log.warn('Source budget reached during persistence', {
            researchId,
            maxSources,
          });
          break;
        }

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
          sourceUrls.push(finding.sourceUrl);

          await publishEvent(researchId, 'research.source_found', {
            step: 'source_found',
            message: `Source found: ${finding.sourceTitle}`,
            metadata: {
              url: finding.sourceUrl,
              title: finding.sourceTitle,
              sourceCount: sourceUrls.length,
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
      log.error(`Finding extraction failed for task ${i + 1}`, {
        researchId,
        error: String(error),
      });
    }
  }

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'analyzing' },
  });

  await publishEvent(researchId, 'research.analyzing', {
    step: 'analyzing',
    message: `Analyzing ${allFindings.length} findings from ${sourceUrls.length} sources`,
    metadata: {
      findingCount: allFindings.length,
      sourceCount: sourceUrls.length,
    },
  });

  log.info(`Research complete`, {
    researchId,
    totalFindings: allFindings.length,
    sourceCount: sourceUrls.length,
    tokensUsed: totalTokens,
  });

  return { findings: allFindings, sources: sourceUrls, tokensUsed: totalTokens };
}

export async function analyzeGaps(
  input: ResearchWorkflowInput,
  findings: Finding[],
): Promise<{ analysis: GapAnalysis; tokensUsed: number }> {
  const { researchId, question } = input;

  log.info(`Analyzing findings for gaps`, {
    researchId,
    findingCount: findings.length,
  });

  const findingsText = findings
    .map(
      (f, i) =>
        `### Finding ${i + 1}\n**Claim:** ${f.claim}\n**Source:** [${f.sourceTitle}](${f.sourceUrl})\n${f.evidence ? `**Evidence:** ${f.evidence}\n` : ''}`,
    )
    .join('\n\n');

  const prompt = `You are analyzing the completeness of a research investigation.

**Research question:** ${question}

Here are the ${findings.length} findings collected so far:

${findingsText}

Evaluate whether these findings sufficiently answer the research question. Consider:
- Are all major aspects or subtopics of the question covered?
- Are there important missing topics, comparisons, or perspectives?
- Is any critical information missing (e.g., pricing, dates, specifics)?
- Are there conflicting claims that need resolution?

Completeness criteria:
- All major subtopics of the question have at least one finding.
- Each compared option/entity has coverage for features, limitations, and (where relevant) pricing.
- Key claims are backed by evidence.
- No major unanswered aspect remains.

If the findings are complete, set isComplete to true and return an empty gaps array.
Otherwise, identify the most important gaps. For each gap, provide:
- topic: the missing subject
- description: what information is missing and why it matters
- searchQueries: 2-3 specific queries that would find this information

Return only genuine, important gaps (max 3).`;

  const agent = mastra.getAgentById('research-agent');

  const response = await agent.generate(prompt, {
    structuredOutput: { schema: gapAnalysisSchema },
  });

  const analysis = response.object;
  log.info(`Gap analysis complete`, {
    researchId,
    isComplete: analysis.isComplete,
    gapCount: analysis.gaps.length,
    tokensUsed: tokensUsed(response),
  });

  if (analysis.isComplete) {
    await publishEvent(researchId, 'research.analyzing', {
      step: 'gap_analysis',
      message: 'Findings are complete — no important gaps',
      metadata: { isComplete: true, findingCount: findings.length },
    });
  } else {
    await publishEvent(researchId, 'research.gap_detected', {
      step: 'gap_analysis',
      message: `${analysis.gaps.length} gap${analysis.gaps.length !== 1 ? 's' : ''} found to research further`,
      metadata: {
        gapCount: analysis.gaps.length,
        gaps: analysis.gaps.map((g) => g.topic),
      },
    });
  }

  return { analysis, tokensUsed: tokensUsed(response) };
}

export async function generateReport(
  input: ResearchWorkflowInput,
): Promise<{ report: GeneratedReport; tokensUsed: number }> {
  const { researchId, question, instructions } = input;

  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'generating_report' },
  });

  await publishEvent(researchId, 'research.generating_report', {
    step: 'generating_report',
    message: 'Generating the research report',
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

  return { report, tokensUsed: tokensUsed(response) };
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

  await publishEvent(researchId, 'research.completed', {
    step: 'completed',
    message: 'Research completed',
  });
}

export async function failResearch(
  input: ResearchWorkflowInput,
  error: string,
): Promise<void> {
  const { researchId } = input;
  log.error('Failing research', { researchId, error });

  try {
    await prisma.research.update({
      where: { id: researchId },
      data: { status: 'failed' },
    });
  } catch (updateError) {
    log.error('Failed to update research status', {
      researchId,
      error: String(updateError),
    });
  }

  await publishEvent(researchId, 'research.failed', {
    step: 'failed',
    message: `Research failed: ${error.slice(0, 300)}`,
    metadata: { error: error.slice(0, 1000) },
  });
}
