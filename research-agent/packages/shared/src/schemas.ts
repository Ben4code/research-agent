import { z } from 'zod';

// ── Enums ───────────────────────────────────────────────────────────

export const researchStatusSchema = z.enum([
  'pending',
  'planning',
  'researching',
  'analyzing',
  'generating_report',
  'completed',
  'failed',
  'waiting_for_user',
]);

// ── Request schemas ─────────────────────────────────────────────────

export const createResearchSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000),
  instructions: z.string().max(2000).optional(),
});

// ── Response schemas ────────────────────────────────────────────────

export const researchResponseSchema = z.object({
  id: z.string(),
  status: researchStatusSchema,
});

export const researchRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  question: z.string(),
  instructions: z.string().nullable().optional(),
  status: researchStatusSchema,
  workflowId: z.string().nullable().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export const researchListResponseSchema = z.object({
  items: z.array(researchRecordSchema),
  total: z.number(),
});

// ── Inferred types ──────────────────────────────────────────────────

export type ResearchStatus = z.infer<typeof researchStatusSchema>;
export type CreateResearchRequest = z.infer<typeof createResearchSchema>;
export type ResearchResponse = z.infer<typeof researchResponseSchema>;
export type ResearchRecord = z.infer<typeof researchRecordSchema>;
export type ResearchListResponse = z.infer<typeof researchListResponseSchema>;

// ── Agent output schemas (used by Mastra + Temporal activities) ─────

export const researchStepSchema = z.object({
  description: z.string().describe('What this research step will investigate'),
  searchQueries: z
    .array(z.string())
    .describe('Search queries to execute for this step'),
  targets: z
    .array(z.string())
    .describe('Specific entities, products, or topics to investigate'),
});

export const researchPlanSchema = z.object({
  topic: z.string().describe('The main research topic derived from the question'),
  summary: z.string().describe('A brief summary of the research approach'),
  steps: z
    .array(researchStepSchema)
    .min(1)
    .describe('Ordered research steps to execute'),
});

export const findingSchema = z.object({
  topic: z.string(),
  claim: z.string(),
  evidence: z.string().optional().describe('Supporting evidence for the claim'),
  sourceUrl: z.string(),
  sourceTitle: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const findingsSchema = z.object({
  findings: z.array(findingSchema),
});

export type ResearchStep = z.infer<typeof researchStepSchema>;
export type ResearchPlan = z.infer<typeof researchPlanSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Findings = z.infer<typeof findingsSchema>;

// ── Report generation schema ────────────────────────────────────────

export const generatedReportSchema = z.object({
  title: z.string().describe('Report title'),
  executiveSummary: z.string().describe('Brief summary of key findings'),
  content: z
    .string()
    .describe('Full report body in Markdown format with sections, tables, and analysis'),
});

export type GeneratedReport = z.infer<typeof generatedReportSchema>;

// ── Tool schemas (used by Mastra tools + Temporal activities) ───────

export const searchWebInputSchema = z.object({
  query: z.string().min(1).max(500).describe('The search query'),
  maxResults: z.number().min(1).max(10).default(5).describe('Max results to return'),
});

export const searchWebOutputSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    }),
  ),
});

export const fetchPageInputSchema = z.object({
  url: z.string().url().describe('The URL to fetch'),
});

export const fetchPageOutputSchema = z.object({
  url: z.string(),
  title: z.string(),
  content: z.string(),
});

export const saveFindingInputSchema = z.object({
  researchId: z.string().describe('The research project ID'),
  sourceUrl: z.string().describe('The source URL the finding came from'),
  sourceTitle: z.string().describe('The title of the source'),
  claim: z.string().describe('The claim or finding extracted'),
  evidence: z.string().optional().describe('Supporting evidence for the claim'),
  confidence: z.enum(['high', 'medium', 'low']).default('medium').describe('Confidence level'),
});

export const saveFindingOutputSchema = z.object({
  findingId: z.string(),
  sourceId: z.string(),
});

export type SearchWebInput = z.infer<typeof searchWebInputSchema>;
export type SearchWebOutput = z.infer<typeof searchWebOutputSchema>;
export type FetchPageInput = z.infer<typeof fetchPageInputSchema>;
export type FetchPageOutput = z.infer<typeof fetchPageOutputSchema>;
export type SaveFindingInput = z.infer<typeof saveFindingInputSchema>;
export type SaveFindingOutput = z.infer<typeof saveFindingOutputSchema>;
