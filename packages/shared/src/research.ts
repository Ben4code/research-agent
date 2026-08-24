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

export interface ResearchReport {
  title: string;
  content: string;
}

// ── Iterative research (Phase 8) ────────────────────────────────────

export interface ResearchTask {
  description: string;
  searchQueries: string[];
}

export interface ResearchBudget {
  maxIterations: number;
  maxSources: number;
  maxDurationMinutes: number;
  maxTokens: number;
}

// ── Workflow types (shared between API client and worker) ──────────

export interface ResearchWorkflowInput {
  researchId: string;
  question: string;
  instructions?: string;
  budget?: Partial<ResearchBudget>;
}
