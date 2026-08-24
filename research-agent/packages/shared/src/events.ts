import { z } from 'zod';

export type ResearchEventType =
  | 'research.started'
  | 'research.planning'
  | 'research.searching'
  | 'research.source_found'
  | 'research.analyzing'
  | 'research.gap_detected'
  | 'research.generating_report'
  | 'research.completed'
  | 'research.failed';

export interface ResearchEvent {
  type: ResearchEventType;
  researchId: string;
  step?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ── Event schemas (Phase 9 — progress events) ───────────────────────

export const researchEventTypeSchema = z.enum([
  'research.started',
  'research.planning',
  'research.searching',
  'research.source_found',
  'research.analyzing',
  'research.gap_detected',
  'research.generating_report',
  'research.completed',
  'research.failed',
]);

export const researchEventSchema = z.object({
  id: z.string(),
  type: researchEventTypeSchema,
  researchId: z.string(),
  step: z.string().optional(),
  message: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});

export const researchEventsResponseSchema = z.object({
  items: z.array(researchEventSchema),
});

export type ResearchEventRecord = z.infer<typeof researchEventSchema>;
export type ResearchEventsResponse = z.infer<
  typeof researchEventsResponseSchema
>;
