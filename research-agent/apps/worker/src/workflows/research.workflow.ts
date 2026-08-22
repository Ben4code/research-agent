import { proxyActivities, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities/research.activities.js';
import { clarifySignal, type ResearchWorkflowInput } from './types.js';

const { initializeResearch, createResearchPlan, completeResearch } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '60s',
    retry: {
      initialInterval: '1s',
      backoffCoefficient: 2,
      maximumInterval: '30s',
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

  await initializeResearch(input);
  const plan = await createResearchPlan(input);
  console.log(`Research plan: ${plan.topic} (${plan.steps.length} steps)`);
  await completeResearch(input, plan);
}
