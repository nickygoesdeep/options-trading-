import yahooFinance from 'yahoo-finance2';
import type { SignalOutput } from '@quant-engine/shared';

export interface TechnicalAnalyzer {
  analyze(ticker: string): Promise<SignalOutput | null>;
}

function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export async function analyzeTechnicals(
  ticker: string
): Promise<SignalOutput | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 21); // extra buffer for 14 trading days

    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    if (!result || result.length < 2) {
      console.warn(`[technicals] Insufficient data for ${ticker}`);
      return null;
    }

    const closes = result.map((bar) => bar.close);
    const volumes = result.map((bar) => bar.volume);

    const price = closes[closes.length - 1];
    const rsi = Math.round(calculateRSI(closes, 14) * 100) / 100;

    const latestVolume = volumes[volumes.length - 1];
    const avgVolume =
      volumes.slice(-15, -1).reduce((sum, v) => sum + v, 0) /
      Math.min(14, volumes.length - 1);
    const volumeRatio = avgVolume > 0
      ? Math.round((latestVolume / avgVolume) * 100) / 100
      : 1;

    // IV from options chain (best-effort)
    let iv: number | null = null;
    try {
      const options = await yahooFinance.options(ticker);
      if (options?.options?.[0]?.calls?.[0]?.impliedVolatility) {
        const calls = options.options[0].calls;
        const ivValues = calls
          .map((c) => c.impliedVolatility)
          .filter((v): v is number => v != null && v > 0);
        if (ivValues.length > 0) {
          iv = Math.round(
            (ivValues.reduce((sum, v) => sum + v, 0) / ivValues.length) * 10000
          ) / 10000;
        }
      }
    } catch {
      // IV not available for this ticker — continue without it
    }

    return {
      ticker,
      price,
      rsi,
      volume: latestVolume,
      volumeRatio,
      iv,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[technicals] Error analyzing ${ticker}:`, error);
    return null;
  }
}
