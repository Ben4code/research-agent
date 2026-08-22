export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface FetchPageResponse {
  url: string;
  title: string;
  content: string;
}

export interface Finding {
  topic: string;
  claim: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ResearchGap {
  topic: string;
  description: string;
}

export interface ResearchPlan {
  topic: string;
  steps: string[];
}

export interface ResearchReport {
  title: string;
  content: string;
}

// ── Workflow types (shared between API client and worker) ──────────

export interface ResearchWorkflowInput {
  researchId: string;
  question: string;
  instructions?: string;
}
