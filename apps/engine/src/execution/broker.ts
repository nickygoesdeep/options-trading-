import type { BrokerOrder, Trade } from '@quant-engine/shared';

export interface BrokerClient {
  submitOrder(order: BrokerOrder): Promise<Trade>;
  closePosition(tradeId: string): Promise<Trade>;
}

/** TODO: Submit a validated order to the broker API. Handle order confirmation, fills, and error states. Return the resulting Trade record. */
export async function submitOrder(
  order: BrokerOrder
): Promise<Trade> {
  throw new Error('TODO: implement submitOrder');
}

/** TODO: Close an existing open position by trade ID. Submit a SELL_TO_CLOSE order and update the trade record with exit price and PnL. */
export async function closePosition(
  tradeId: string
): Promise<Trade> {
  throw new Error('TODO: implement closePosition');
}
