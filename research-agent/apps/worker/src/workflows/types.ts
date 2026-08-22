import { defineSignal } from '@temporalio/workflow';
import type { ResearchWorkflowInput } from '@research-agent/shared';

export type { ResearchWorkflowInput };

export const clarifySignal = defineSignal<[string]>('clarify');
