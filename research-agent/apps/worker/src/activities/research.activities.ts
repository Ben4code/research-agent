import { log } from '@temporalio/activity';
import { prisma } from '../db/prisma.js';
import type { ResearchWorkflowInput } from '@research-agent/shared';

// ── Phase 4: Activities persist status changes to PostgreSQL ──────
// These are still stubs — real AI/search logic arrives in Phases 5–7.
// The key Phase 4 goal is proving the DB status update path works.

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

export async function performResearch(
  input: ResearchWorkflowInput,
): Promise<void> {
  const { researchId, question } = input;

  // Researching phase
  log.info('Researching', { researchId, question });
  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'researching' },
  });

  // Analyzing phase
  log.info('Analyzing research', { researchId });
  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'analyzing' },
  });

  // Generating report phase
  log.info('Generating report', { researchId });
  await prisma.research.update({
    where: { id: researchId },
    data: { status: 'generating_report' },
  });

  // Placeholder: persist a stub report
  // Real report generation arrives in Phase 7
  await prisma.report.create({
    data: {
      researchId,
      title: `Research: ${question.slice(0, 80)}`,
      content: `# Research Report\n\n**Question:** ${question}\n\n_Report generation is a stub in Phase 4. Real AI-generated reports arrive in Phase 7._`,
    },
  });
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
