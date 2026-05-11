import type { SignalDirection } from './signal.types';

/** Current status of a trade */
export type TradeStatus = 'pending' | 'open' | 'closed' | 'cancelled' | 'error';

/** Reason a trade was exited */
export type ExitReason =
  | 'stop_loss'
  | 'expired'
  | 'confidence_drop'
  | 'take_profit'
  | 'manual';

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
  brokerOrderId: string | null;
  decisionId: string | null;
  signalId: string | null;
  optionType: 'CALL' | 'PUT' | null;
  paperTrade: boolean;
  exitReason: ExitReason | null;
}

/** Fields sent to Supabase when opening a new trade */
export type TradeInsert = Omit<
  Trade,
  | 'id'
  | 'brokerOrderId'
  | 'decisionId'
  | 'signalId'
  | 'optionType'
  | 'exitReason'
  | 'exitPrice'
  | 'closedAt'
  | 'pnl'
> & {
  brokerOrderId?: string | null;
  decisionId?: string | null;
  signalId?: string | null;
  optionType?: 'CALL' | 'PUT' | null;
  exitReason?: ExitReason | null;
  exitPrice?: number | null;
  closedAt?: Date | null;
  pnl?: number | null;
};

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
