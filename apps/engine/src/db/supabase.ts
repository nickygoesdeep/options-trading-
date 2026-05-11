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
        direction: signal.direction,
        confidence: signal.confidence,
        indicators: signal.indicators,
        smart_money: signal.smartMoney,
        created_at: signal.timestamp.toISOString(),
      });

    if (error) {
      console.error('[db] Failed to insert signal:', error.message);
    }
  } catch (err) {
    console.error('[db] insertSignal error:', err);
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
  try {
    const { error } = await getClient()
      .from('agent_health')
      .upsert(
        {
          id: health.id,
          service: health.service,
          status: health.status,
          last_run: health.lastRun,
          latency_ms: health.latencyMs,
          error_count: health.errorCount,
          message: health.message ?? null,
          created_at: health.createdAt,
          updated_at: health.updatedAt,
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('[db] Failed to upsert agent health:', error.message);
    }
  } catch (err) {
    console.error('[db] updateAgentHealth error:', err);
  }
}
