import type { DecisionOutput, Trade, RiskCheckResult } from '@quant-engine/shared';

const MAX_RISK_PER_TRADE = 20;
const MAX_DAILY_LOSS = 40;
const MAX_OPEN_POSITIONS = 2;
const MIN_CONFIDENCE = 75;

export function checkRisk(
  decision: DecisionOutput,
  openPositions: Trade[]
): RiskCheckResult {
  if (decision.verdict === 'HOLD' || decision.verdict === 'SKIP') {
    return { approved: false, reason: 'No actionable signal' };
  }

  if (decision.confidence < MIN_CONFIDENCE) {
    return { approved: false, reason: 'Confidence below threshold' };
  }

  if (openPositions.length >= MAX_OPEN_POSITIONS) {
    return { approved: false, reason: 'Max open positions reached' };
  }

  const totalRisk = openPositions.reduce(
    (sum, pos) => sum + pos.entryPrice * pos.quantity,
    0
  );
  if (totalRisk >= MAX_DAILY_LOSS) {
    return { approved: false, reason: 'Daily loss limit reached' };
  }

  return { approved: true, maxRiskAllowed: MAX_RISK_PER_TRADE };
}
