import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const [key, ...vals] = line.trim().split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
} catch {
  console.warn('[env] Could not load .env file');
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SignalOutput, DecisionOutput, Trade, TradeInsert, AgentHealth } from '@quant-engine/shared';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}

export async function insertSignal(signal: SignalOutput): Promise<void> {
  try {
    const { error } = await getClient()
      .from('signals')
      .insert({
        ticker: signal.ticker,
        price: signal.price,
        rsi: signal.rsi,
        volume: signal.volume,
        volume_ratio: signal.volumeRatio,
        iv: signal.iv,
        created_at: signal.timestamp.toISOString(),
      });

    if (error) {
      console.error('[db] Failed to insert signal:', error.message);
    }
  } catch (err) {
    console.error('[db] insertSignal error:', err);
  }
}

export async function getOpenPositions(): Promise<Trade[]> {
  try {
    const { data, error } = await getClient()
      .from('trades')
      .select('*')
      .in('status', ['pending', 'filled']);

    if (error) {
      console.error('[db] Failed to get open positions:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map(mapRowToTrade);
  } catch (err) {
    console.error('[db] getOpenPositions error:', err);
    return [];
  }
}

export async function insertDecision(decision: DecisionOutput): Promise<void> {
  try {
    const { error } = await getClient()
      .from('decisions')
      .insert({
        verdict: decision.verdict,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        suggested_strike: decision.suggestedStrike,
        suggested_expiry: decision.suggestedExpiry,
        created_at: decision.timestamp.toISOString(),
      });

    if (error) {
      console.error('[db] Failed to insert decision:', error.message);
    }
  } catch (err) {
    console.error('[db] insertDecision error:', err);
  }
}

export async function insertTrade(trade: Trade): Promise<void> {
  try {
    const { error } = await getClient()
      .from('trades')
      .insert({
        id: trade.id,
        ticker: trade.ticker,
        direction: trade.direction,
        strike: trade.strike,
        expiry: trade.expiry,
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
        quantity: trade.quantity,
        status: trade.status,
        pnl: trade.pnl,
        confidence: trade.confidence,
        opened_at: trade.openedAt.toISOString(),
        closed_at: trade.closedAt?.toISOString() ?? null,
      });

    if (error) {
      console.error('[db] Failed to insert trade:', error.message);
    }
  } catch (err) {
    console.error('[db] insertTrade error:', err);
  }
}

export async function updateAgentHealth(health: AgentHealth): Promise<void> {
  const client = getClient();
  try {
    const { data: existing } = await client
      .from('agent_health')
      .select('id')
      .eq('service', health.service)
      .maybeSingle();

    if (existing) {
      await client
        .from('agent_health')
        .update({
          status: health.status,
          last_run: health.lastRun,
          latency_ms: health.latencyMs,
          error_count: health.errorCount,
          message: health.message ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('service', health.service);
    } else {
      await client
        .from('agent_health')
        .insert({
          service: health.service,
          status: health.status,
          last_run: health.lastRun,
          latency_ms: health.latencyMs,
          error_count: health.errorCount,
          message: health.message ?? null
        });
    }
  } catch (err) {
    console.error('[db] updateAgentHealth error:', err);
  }
}

function mapRowToTrade(row: Record<string, unknown>): Trade {
  return {
    id: row.id as string,
    ticker: row.ticker as string,
    direction: row.direction as Trade['direction'],
    strike: Number(row.strike),
    expiry: row.expiry as string,
    entryPrice: Number(row.entry_price),
    exitPrice: row.exit_price != null ? Number(row.exit_price) : null,
    quantity: row.quantity as number,
    status: row.status as Trade['status'],
    pnl: row.pnl != null ? Number(row.pnl) : null,
    confidence: Number(row.confidence),
    openedAt: new Date(row.opened_at as string),
    closedAt: row.closed_at ? new Date(row.closed_at as string) : null,
    brokerOrderId: (row.broker_order_id as string) ?? null,
    decisionId: (row.decision_id as string) ?? null,
    signalId: (row.signal_id as string) ?? null,
    optionType: (row.option_type as Trade['optionType']) ?? null,
    paperTrade: row.paper_trade as boolean,
    exitReason: (row.exit_reason as Trade['exitReason']) ?? null,
  };
}

export async function insertPendingTrade(trade: TradeInsert): Promise<Trade> {
  const { data, error } = await getClient()
    .from('trades')
    .insert({
      ticker: trade.ticker,
      direction: trade.direction,
      strike: trade.strike,
      expiry: trade.expiry,
      entry_price: trade.entryPrice,
      exit_price: trade.exitPrice ?? null,
      quantity: trade.quantity,
      status: 'pending',
      pnl: trade.pnl ?? null,
      confidence: trade.confidence,
      opened_at: trade.openedAt.toISOString(),
      closed_at: trade.closedAt?.toISOString() ?? null,
      broker_order_id: trade.brokerOrderId ?? null,
      decision_id: trade.decisionId ?? null,
      signal_id: trade.signalId ?? null,
      option_type: trade.optionType ?? null,
      paper_trade: true,
      exit_reason: trade.exitReason ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[db] Failed to insert pending trade: ${error?.message ?? 'no data returned'}`);
  }

  return mapRowToTrade(data);
}

export async function updateTradeOnFill(
  tradeId: string,
  brokerOrderId: string,
  entryPrice: number
): Promise<Trade> {
  const { data, error } = await getClient()
    .from('trades')
    .update({
      broker_order_id: brokerOrderId,
      entry_price: entryPrice,
      status: 'open',
    })
    .eq('id', tradeId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[db] Failed to update trade on fill (${tradeId}): ${error?.message ?? 'row not found'}`);
  }

  return mapRowToTrade(data);
}

export async function closeTrade(
  tradeId: string,
  exitPrice: number,
  pnl: number,
  exitReason: 'stop_loss' | 'expired' | 'confidence_drop' | 'take_profit' | 'manual'
): Promise<Trade> {
  const { data, error } = await getClient()
    .from('trades')
    .update({
      exit_price: exitPrice,
      pnl,
      exit_reason: exitReason,
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', tradeId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[db] Failed to close trade (${tradeId}): ${error?.message ?? 'row not found'}`);
  }

  return mapRowToTrade(data);
}

export async function markTradeFailed(tradeId: string, reason: string): Promise<Trade> {
  console.error(`[db] Marking trade ${tradeId} as failed: ${reason}`);

  const { data, error } = await getClient()
    .from('trades')
    .update({
      status: 'failed',
      exit_reason: 'manual',
      closed_at: new Date().toISOString(),
    })
    .eq('id', tradeId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`[db] Failed to mark trade as failed (${tradeId}): ${error?.message ?? 'row not found'}`);
  }

  return mapRowToTrade(data);
}

export async function sendSlackAlert(
  webhookUrl: string,
  message: Record<string, unknown>
): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('[slack] Alert sent successfully');
    } else {
      console.error('[slack] Failed to send alert:', response.status, response.statusText);
    }
  } catch (err) {
    console.error('[slack] sendSlackAlert error:', err);
  }
}
