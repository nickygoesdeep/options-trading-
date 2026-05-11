import type { RiskLimits, RiskCheckResult, DecisionOutput } from '@quant-engine/shared';

export interface RiskGuardrail {
  check(decision: DecisionOutput, limits: RiskLimits): Promise<RiskCheckResult>;
}

/** TODO: Enforce all risk limits before allowing trade execution. Check: max risk per trade ($20), max daily loss ($40), max open positions (2), min confidence (85). Never bypass regardless of confidence score. Return RiskCheckResult with approval status and reason. */
export async function checkRisk(
  decision: DecisionOutput,
  limits: RiskLimits
): Promise<RiskCheckResult> {
  throw new Error('TODO: implement checkRisk');
}
