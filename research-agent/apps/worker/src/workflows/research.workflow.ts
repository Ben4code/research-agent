import { proxyActivities, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities/research.activities.js';
import {
  clarifySignal,
  type ResearchWorkflowInput,
} from './types.js';
import type {
  Finding,
  ResearchTask,
  ResearchBudget,
} from '@research-agent/shared';

const DEFAULT_BUDGET: ResearchBudget = {
  maxIterations: 3,
  maxSources: 30,
  maxDurationMinutes: 45,
  maxTokens: 400_000,
};

const {
  initializeResearch,
  createResearchPlan,
  performResearch,
  analyzeGaps,
  generateReport,
  completeResearch,
  failResearch,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5m',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumInterval: '60s',
    maximumAttempts: 3,
  },
});

export async function researchWorkflow(
  input: ResearchWorkflowInput,
): Promise<void> {
  // Signal handler for future human-in-the-loop (Phase 12)
  setHandler(clarifySignal, (answer: string) => {
    console.log(`Clarification received: ${answer}`);
  });

  try {
    await runResearch(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Research workflow failed: ${message}`);
    await failResearch(input, message);
    throw error;
  }
}

async function runResearch(input: ResearchWorkflowInput): Promise<void> {
  const budget: ResearchBudget = {
    ...DEFAULT_BUDGET,
    ...(input.budget ?? {}),
  };

  const startedAt = Date.now();
  let totalTokens = 0;
  let sources: string[] = [];

  await initializeResearch(input);

  const { plan, tokensUsed: planTokens } = await createResearchPlan(input);
  totalTokens += planTokens;
  console.log(`Research plan: ${plan.topic} (${plan.steps.length} steps)`);

  let tasks: ResearchTask[] = plan.steps.map((step) => ({
    description: step.description,
    searchQueries: step.searchQueries,
  }));

  let allFindings: Finding[] = [];

  for (let iteration = 0; iteration < budget.maxIterations; iteration++) {
    const elapsedMinutes = (Date.now() - startedAt) / 60000;
    console.log(
      `Iteration ${iteration + 1}/${budget.maxIterations} — sources: ${sources.length}/${budget.maxSources}, tokens: ${totalTokens}/${budget.maxTokens}, elapsed: ${elapsedMinutes.toFixed(1)}m/${budget.maxDurationMinutes}m`,
    );

    const research = await performResearch(input, tasks, budget.maxSources);
    allFindings = allFindings.concat(research.findings);
    sources = research.sources;
    totalTokens += research.tokensUsed;
    console.log(
      `Research complete: ${research.findings.length} new findings (${sources.length} sources total)`,
    );

    const isComplete =
      allFindings.length === 0 ||
      sources.length >= budget.maxSources ||
      totalTokens >= budget.maxTokens ||
      Date.now() - startedAt >= budget.maxDurationMinutes * 60000;

    if (isComplete) {
      console.log('Stopping research: budget or no-findings reached');
      break;
    }

    const { analysis, tokensUsed: gapTokens } = await analyzeGaps(
      input,
      allFindings,
    );
    totalTokens += gapTokens;

    if (analysis.isComplete || analysis.gaps.length === 0) {
      console.log('Gap analysis: findings are complete — generating report');
      break;
    }

    console.log(
      `Gap analysis found ${analysis.gaps.length} gaps: ${analysis.gaps
        .map((g) => g.topic)
        .join(', ')}`,
    );

    tasks = analysis.gaps.map((gap) => ({
      description: `${gap.topic}: ${gap.description}`,
      searchQueries: gap.searchQueries,
    }));
  }

  const { report } = await generateReport(input);
  console.log(`Report generated: ${report.title}`);

  await completeResearch(input);
}