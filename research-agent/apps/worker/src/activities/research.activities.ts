import { log } from '@temporalio/activity';
import { prisma } from '../db/prisma.js';
import { mastra } from '../mastra/index.js';
import {
  researchPlanSchema,
  type ResearchWorkflowInput,
  type ResearchPlan,
} from '@research-agent/shared';

// ── Phase 5: Activities use Mastra agent for research planning ─────
// Search/fetch/extract tools arrive in Phase 6–7.

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
    structuredOutput: {
      schema: researchPlanSchema,
    },
  });

  const plan = response.object;
  log.info('Research plan created', {
    researchId,
    topic: plan.topic,
    stepCount: plan.steps.length,
  });

  return plan;
}

export async function completeResearch(
  input: ResearchWorkflowInput,
  plan: ResearchPlan,
): Promise<void> {
  const { researchId } = input;
  log.info('Completing research', { researchId });

  const reportContent = [
    `# ${plan.topic}`,
    '',
    plan.summary,
    '',
    '## Research Plan',
    '',
    ...plan.steps.map((step, i) => {
      const queries = step.searchQueries
        .map((q) => `  - ${q}`)
        .join('\n');
      const targets = step.targets.length
        ? `\n  **Targets:** ${step.targets.join(', ')}`
        : '';
      return `### Step ${i + 1}: ${step.description}\n\n**Search queries:**\n${queries}${targets}`;
    }),
    '',
    '---',
    '_This is a Phase 5 stub report containing the AI-generated research plan. Full reports with sources and findings arrive in Phase 7._',
  ].join('\n');

  await prisma.report.create({
    data: {
      researchId,
      title: plan.topic,
      content: reportContent,
    },
  });

  await prisma.research.update({
    where: { id: researchId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });
}
