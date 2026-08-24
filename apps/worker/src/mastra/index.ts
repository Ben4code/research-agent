import { Mastra } from '@mastra/core';
import { researchAgent } from './agents/research-agent.js';

export const mastra = new Mastra({
  agents: { researchAgent },
});
