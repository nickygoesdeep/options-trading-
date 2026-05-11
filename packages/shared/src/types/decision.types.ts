import type { SignalOutput } from './signal.types';

/** Claude's decision on whether to trade */
export type DecisionVerdict = 'BUY_CALL' | 'BUY_PUT' | 'HOLD' | 'SKIP';

/** Reasoning structure from Claude decision layer */
export interface DecisionReasoning {
  summary: string;
  bullishFactors: string[];
  bearishFactors: string[];
  riskNotes: string[];
}

/** Full decision output from Claude */
export interface DecisionOutput {
  verdict: DecisionVerdict;
  confidence: number;
  reasoning: DecisionReasoning;
  signal: SignalOutput;
  suggestedStrike: number | null;
  suggestedExpiry: string | null;
  timestamp: Date;
}

/** Configuration for the Claude decision prompt */
export interface DecisionConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}
