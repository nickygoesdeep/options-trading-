import type { DecisionOutput } from '@quant-engine/shared';

const TRADIER_SANDBOX_URL = 'https://sandbox.tradier.com/v1/accounts';

function buildOccSymbol(
  ticker: string,
  expiry: string,
  strike: number,
  optionType: 'CALL' | 'PUT'
): string {
  // Ticker left-padded with spaces to 6 characters
  const paddedTicker = ticker.padEnd(6, ' ');

  // Date as YYMMDD from YYYY-MM-DD
  const [yyyy, mm, dd] = expiry.split('-');
  const yy = yyyy.slice(2);
  const datePart = `${yy}${mm}${dd}`;

  // C or P
  const typeLetter = optionType === 'CALL' ? 'C' : 'P';

  // Strike * 1000, zero-padded to 8 digits
  const strikePart = Math.round(strike * 1000).toString().padStart(8, '0');

  return `${paddedTicker}${datePart}${typeLetter}${strikePart}`;
}

export async function placeOrder(
  decision: DecisionOutput,
  optionType: 'CALL' | 'PUT'
): Promise<{
  brokerOrderId: string;
  fillPrice: number;
  occSymbol: string;
}> {
  const token = process.env.TRADIER_TOKEN;
  const accountId = process.env.TRADIER_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error('Missing TRADIER_TOKEN or TRADIER_ACCOUNT_ID environment variables');
  }

  if (decision.suggestedStrike == null || decision.suggestedExpiry == null) {
    throw new Error('[broker] Decision is missing suggestedStrike or suggestedExpiry');
  }

  const ticker = decision.signal.ticker;
  const occSymbol = buildOccSymbol(ticker, decision.suggestedExpiry, decision.suggestedStrike, optionType);

  const body = new URLSearchParams({
    class: 'option',
    symbol: ticker,
    option_symbol: occSymbol,
    side: 'buy_to_open',
    quantity: '1',
    type: 'market',
    duration: 'day',
  });

  const response = await fetch(`${TRADIER_SANDBOX_URL}/${accountId}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      if (errorBody?.errors?.error) {
        errorMessage = Array.isArray(errorBody.errors.error)
          ? errorBody.errors.error.join('; ')
          : errorBody.errors.error;
      }
    } catch {
      // keep statusText as fallback
    }
    throw new Error(`[broker] Tradier order failed (HTTP ${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  const orderId = data?.order?.id;

  if (!orderId) {
    throw new Error('[broker] Tradier response missing order.id');
  }

  return {
    brokerOrderId: String(orderId),
    fillPrice: 0,
    occSymbol,
  };
}
