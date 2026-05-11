/** Direction of the trade signal */
export type SignalDirection = 'CALL' | 'PUT';

/** Timeframe for technical analysis */
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d';

/** A single technical indicator reading */
export interface IndicatorReading {
  name: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  weight: number;
}

/** Smart money flow data */
export interface SmartMoneyData {
  ticker: string;
  unusualVolume: boolean;
  optionsFlow: 'bullish' | 'bearish' | 'neutral';
  darkPoolActivity: number;
  timestamp: Date;
}

/** Raw signal data from technical analysis — no direction or confidence (those belong in the decision layer) */
export interface SignalOutput {
  ticker: string;
  price: number;
  rsi: number;
  volume: number;
  volumeRatio: number;
  iv: number | null;
  timestamp: Date;
}

/** Universe filter criteria */
export interface UniverseFilter {
  minVolume: number;
  minOptionVolume: number;
  maxSpread: number;
  sectors?: string[];
}
