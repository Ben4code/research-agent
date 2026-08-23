import { proxyActivities, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities/research.activities.js';
import { clarifySignal, type ResearchWorkflowInput } from './types.js';

const {
  initializeResearch,
  createResearchPlan,
  performResearch,
  generateReport,
  completeResearch,
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

  await initializeResearch(input);

  const plan = await createResearchPlan(input);
  console.log(`Research plan: ${plan.topic} (${plan.steps.length} steps)`);

  const findings = await performResearch(input, plan);
  console.log(`Research complete: ${findings.length} findings extracted`);

  const report = await generateReport(input);
  console.log(`Report generated: ${report.title}`);

  await completeResearch(input);
}
