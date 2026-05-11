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
import type { SignalOutput, DecisionOutput, Trade, AgentHealth } from '@quant-engine/shared';

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

    return data.map((row) => ({
      id: row.id,
      ticker: row.ticker,
      direction: row.direction,
      strike: Number(row.strike),
      expiry: row.expiry,
      entryPrice: Number(row.entry_price),
      exitPrice: row.exit_price != null ? Number(row.exit_price) : null,
      quantity: row.quantity,
      status: row.status,
      pnl: row.pnl != null ? Number(row.pnl) : null,
      confidence: Number(row.confidence),
      openedAt: new Date(row.opened_at),
      closedAt: row.closed_at ? new Date(row.closed_at) : null,
    }));
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
