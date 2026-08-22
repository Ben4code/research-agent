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
