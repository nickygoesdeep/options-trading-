import type { SignalOutput, DecisionOutput, DecisionConfig } from '@quant-engine/shared';

export interface DecisionEngine {
  evaluate(signal: SignalOutput, config: DecisionConfig): Promise<DecisionOutput>;
}

/** TODO: Send signal data to Claude via Anthropic SDK. Prompt Claude to evaluate the trade setup, provide a verdict (ENTER/SKIP/WAIT), confidence score, and structured reasoning. Parse and return DecisionOutput. */
export async function evaluateWithClaude(
  signal: SignalOutput,
  config: DecisionConfig
): Promise<DecisionOutput> {
  throw new Error('TODO: implement evaluateWithClaude');
}
