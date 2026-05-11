import type { UniverseFilter } from '@quant-engine/shared';

export const ETFs: readonly string[] = ['SPY', 'QQQ', 'ARKK', 'XLK', 'SOXX'];

export const TECH: readonly string[] = ['NVDA', 'AAPL', 'MSFT', 'META', 'GOOGL', 'AMD'];

export const ALL_TICKERS: readonly string[] = [...ETFs, ...TECH];

export interface UniverseScanner {
  scan(filter?: UniverseFilter): Promise<string[]>;
}

export async function scanUniverse(
  filter?: UniverseFilter
): Promise<string[]> {
  if (!filter) {
    return [...ALL_TICKERS];
  }

  // TODO: When market data integration is live, apply filter.minVolume,
  // filter.minOptionVolume, and filter.maxSpread against real-time quotes.
  // For now, return all tickers — filtering requires live data from yahoo-finance2.
  return [...ALL_TICKERS];
}
