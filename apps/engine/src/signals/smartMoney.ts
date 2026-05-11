import type { SmartMoneyData } from '@quant-engine/shared';

export interface SmartMoneyAnalyzer {
  detect(ticker: string): Promise<SmartMoneyData>;
}

/** TODO: Detect unusual options volume, dark pool prints, and large block trades. Return SmartMoneyData with flow direction and volume flags. */
export async function detectSmartMoney(
  ticker: string
): Promise<SmartMoneyData> {
  throw new Error('TODO: implement detectSmartMoney');
}
