import { proxyActivities, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities/research.activities.js';
import { clarifySignal, type ResearchWorkflowInput } from './types.js';

const { initializeResearch, performResearch, completeResearch } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30s',
    retry: {
      initialInterval: '1s',
      backoffCoefficient: 2,
      maximumInterval: '10s',
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
  await performResearch(input);
  await completeResearch(input);
}
