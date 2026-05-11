import type { AgentHealth, DecisionOutput } from '@quant-engine/shared';
import { scanUniverse } from '../signals/universe.js';
import { analyzeTechnicals } from '../signals/technicals.js';
import { evaluateWithClaude } from '../decision/claude.js';
import { checkRisk } from '../risk/guardrails.js';
import { placeOrder } from '../execution/broker.js';
import {
  insertSignal, insertDecision, updateAgentHealth, sendSlackAlert,
  getOpenPositions, insertPendingTrade, updateTradeOnFill, markTradeFailed,
} from '../db/supabase.js';

const MARKET_OPEN_PST = '06:25';
const MARKET_CLOSE_PST = '13:05';
const TIMEZONE = 'America/Los_Angeles';

const SLACK_WEBHOOK_URL_TRADES = process.env.SLACK_WEBHOOK_URL_TRADES ?? '';
const SLACK_WEBHOOK_URL_HEALTH = process.env.SLACK_WEBHOOK_URL_HEALTH ?? '';

function isMarketOpen(): boolean {
  const now = new Date();
  const pstTime = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  const [hours, minutes] = pstTime.split(':').map(Number);
  const currentMinutes = hours * 60 + minutes;

  const [openH, openM] = MARKET_OPEN_PST.split(':').map(Number);
  const [closeH, closeM] = MARKET_CLOSE_PST.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

function buildHealthRecord(
  service: AgentHealth['service'],
  status: AgentHealth['status'],
  latencyMs: number,
  message?: string
): AgentHealth {
  const now = new Date().toISOString();
  return {
    id: service,
    service,
    status,
    lastRun: now,
    latencyMs,
    errorCount: status === 'healthy' ? 0 : 1,
    message,
    createdAt: now,
    updatedAt: now,
  };
}

function buildTradeAlert(decision: { verdict: string; confidence: number; reasoning: { summary: string; riskNotes: string[] }; signal: { ticker: string }; suggestedExpiry: string | null }) {
  return {
    text: '*Trade Signal Approved*',
    blocks: [
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Ticker:* ${decision.signal.ticker}` },
          { type: 'mrkdwn', text: `*Action:* ${decision.verdict}` },
          { type: 'mrkdwn', text: `*Confidence:* ${decision.confidence}%` },
          { type: 'mrkdwn', text: `*Risk Level:* ${decision.reasoning.riskNotes[0] ?? 'unknown'}` },
          { type: 'mrkdwn', text: `*Expiry:* ${decision.suggestedExpiry ?? 'none'}` },
          { type: 'mrkdwn', text: `*Reasoning:* ${decision.reasoning.summary}` },
        ],
      },
    ],
  };
}

function buildHealthAlert(service: string, status: string, message: string) {
  return {
    text: '*Agent Health Alert*',
    blocks: [
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Service:* ${service}` },
          { type: 'mrkdwn', text: `*Status:* ${status}` },
          { type: 'mrkdwn', text: `*Error:* ${message}` },
          { type: 'mrkdwn', text: `*Time:* ${new Date().toISOString()}` },
        ],
      },
    ],
  };
}

async function executeApprovedDecision(decision: DecisionOutput): Promise<void> {
  // Step 1 — Determine option type
  let optionType: 'CALL' | 'PUT';
  if (decision.verdict === 'BUY_CALL') {
    optionType = 'CALL';
  } else if (decision.verdict === 'BUY_PUT') {
    optionType = 'PUT';
  } else {
    console.log(`[execution] Non-actionable verdict ${decision.verdict}, skipping execution`);
    return;
  }

  const ticker = decision.signal.ticker;
  const strike = decision.suggestedStrike;
  const expiry = decision.suggestedExpiry;

  // Step 2 — Insert pending trade
  let pendingTrade;
  try {
    pendingTrade = await insertPendingTrade({
      ticker,
      direction: optionType,
      strike: strike ?? 0,
      expiry: expiry ?? '',
      entryPrice: 0,
      quantity: 1,
      status: 'pending',
      confidence: decision.confidence,
      openedAt: new Date(),
      paperTrade: true,
      optionType,
      decisionId: null,
      signalId: null,
    });
  } catch (err) {
    console.error(`[execution] Failed to insert pending trade for ${ticker}:`, err);
    return;
  }

  // Step 3 — Place order with Tradier
  let orderResult;
  try {
    orderResult = await placeOrder(decision, optionType);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await markTradeFailed(pendingTrade.id, errorMsg).catch((e) =>
      console.error('[execution] Failed to mark trade as failed:', e)
    );
    if (SLACK_WEBHOOK_URL_TRADES) {
      await sendSlackAlert(SLACK_WEBHOOK_URL_TRADES, {
        text: `Trade failed to execute: ${ticker} ${optionType} ${strike} exp ${expiry} -- ${errorMsg}`,
      });
    }
    return;
  }

  // Step 4 — Confirm fill in Supabase
  try {
    await updateTradeOnFill(pendingTrade.id, orderResult.brokerOrderId, orderResult.fillPrice);
  } catch (err) {
    console.error(`[execution] CRITICAL: Order placed at Tradier (${orderResult.brokerOrderId}) but failed to record fill for trade ${pendingTrade.id}:`, err);
  }

  // Step 5 — Slack fill confirmation
  if (SLACK_WEBHOOK_URL_TRADES) {
    await sendSlackAlert(SLACK_WEBHOOK_URL_TRADES, {
      text: [
        `Trade executed: ${ticker} ${optionType} x1 contract`,
        `Strike: ${strike}  Expiry: ${expiry}`,
        `OCC: ${orderResult.occSymbol}`,
        `Order ID: ${orderResult.brokerOrderId}`,
        `Confidence: ${decision.confidence}%`,
        `Mode: PAPER`,
      ].join('\n'),
    });
  }
}

export async function runEngine(bypassMarketHours: boolean = false): Promise<void> {
  try {
    // 1. Check market hours
    if (!bypassMarketHours && !isMarketOpen()) {
      console.log('[engine] Market closed');
      return;
    }

    // 2. Update scheduler health
    const schedulerStart = Date.now();
    await updateAgentHealth(buildHealthRecord('scheduler', 'healthy', 0));

    // 3. Get tickers
    const tickers = await scanUniverse();

    // 4. Fetch open positions once before the loop
    const openPositions = await getOpenPositions();

    for (const ticker of tickers) {
      try {
        // 4a. Analyze technicals
        const signal = await analyzeTechnicals(ticker);

        // 4b. Skip if no data
        if (!signal) {
          console.log(`[engine] No signal data for ${ticker}, skipping`);
          continue;
        }

        // 4c. Save signal
        await insertSignal(signal);

        // 4d. Claude decision
        const decision = await evaluateWithClaude(signal);

        // 4e. Save decision
        await insertDecision(decision);

        // 4f. Risk check
        const riskResult = checkRisk(decision, openPositions);

        // 4g/4h. Handle result
        if (riskResult.approved) {
          console.log(`[engine] APPROVED: ${ticker} — ${decision.verdict} @ ${decision.confidence}% confidence`);
          if (SLACK_WEBHOOK_URL_TRADES) {
            await sendSlackAlert(SLACK_WEBHOOK_URL_TRADES, buildTradeAlert(decision));
          }
          await executeApprovedDecision(decision);
        } else {
          console.log(`[engine] REJECTED: ${ticker} — ${riskResult.reason}`);
        }
      } catch (tickerError) {
        console.error(`[engine] Error processing ${ticker}:`, tickerError);
        await updateAgentHealth(
          buildHealthRecord('signal_engine', 'degraded', 0, `Error processing ${ticker}: ${tickerError}`)
        );
        if (SLACK_WEBHOOK_URL_HEALTH) {
          await sendSlackAlert(
            SLACK_WEBHOOK_URL_HEALTH,
            buildHealthAlert('signal_engine', 'degraded', `Error processing ${ticker}`)
          );
        }
      }
    }

    // 5. Update signal_engine health
    const totalLatency = Date.now() - schedulerStart;
    await updateAgentHealth(buildHealthRecord('signal_engine', 'healthy', totalLatency));
  } catch (error) {
    // 6. Handle top-level failure
    console.error('[engine] runEngine failed:', error);
    await updateAgentHealth(
      buildHealthRecord('scheduler', 'degraded', 0, `runEngine failed: ${error}`)
    ).catch(() => {});
    if (SLACK_WEBHOOK_URL_HEALTH) {
      await sendSlackAlert(
        SLACK_WEBHOOK_URL_HEALTH,
        buildHealthAlert('scheduler', 'degraded', `runEngine failed: ${error}`)
      ).catch(() => {});
    }
  }
}
