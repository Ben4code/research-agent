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
