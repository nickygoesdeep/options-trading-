import type { SignalDirection } from './signal.types';

/** Current status of a trade */
export type TradeStatus = 'pending' | 'open' | 'closed' | 'cancelled' | 'error';

/** A single options trade */
export interface Trade {
  id: string;
  ticker: string;
  direction: SignalDirection;
  strike: number;
  expiry: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  status: TradeStatus;
  pnl: number | null;
  confidence: number;
  openedAt: Date;
  closedAt: Date | null;
}

/** Risk guardrail limits */
export interface RiskLimits {
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  minConfidence: number;
}

/** Result of a risk check */
export interface RiskCheckResult {
  approved: boolean;
  reason?: string;
  maxRiskAllowed?: number;
}

/** Order to send to broker */
export interface BrokerOrder {
  ticker: string;
  direction: SignalDirection;
  strike: number;
  expiry: string;
  quantity: number;
  limitPrice: number;
  action: 'BUY_TO_OPEN' | 'SELL_TO_CLOSE';
}
