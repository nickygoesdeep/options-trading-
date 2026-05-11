# Quant Engine -- Live State

> This file is updated at the end of every session.
> It is the single source of truth for current project state.
> Never embed live state in the handoff skill.

---

## Current Phase

Phase 7 -- Broker Paper Trading (IN PROGRESS -- awaiting Tradier account approval)

## What Is Working
- Phase 1-6 complete
- Vercel deployment LIVE (cron fires every 5 min, 06:25-13:05 PST)
- Signal engine pulling real market data
- Claude evaluating signals (BUY_CALL / BUY_PUT / SKIP)
- Supabase storing signals, decisions, agent health
- Slack alerts firing on approved signals (#trade-alerts, #agent-health)
- Confidence threshold at 85% for paper trading gate
- trades table migration applied -- 6 new columns added:
    broker_order_id, decision_id, signal_id, option_type,
    paper_trade (default true), exit_reason
- trade.types.ts updated -- TradeInsert type, ExitReason type,
    TradeStatus includes 'failed'
- supabase.ts updated -- insertPendingTrade, updateTradeOnFill,
    closeTrade, markTradeFailed, mapRowToTrade helper
- broker.ts built -- placeOrder, buildOccSymbol (OCC symbol generator)
- cron.ts updated -- executeApprovedDecision wired into orchestrator

## Pending -- Awaiting Tradier
- Tradier Individual brokerage account under review (Level 2 options, no futures)
- Once approved: add TRADIER_TOKEN and TRADIER_ACCOUNT_ID to .env
- Add same two vars to Vercel environment variables
- Run local test-run.ts to confirm first paper trade fires end to end
- Verify trade row appears in Supabase with broker_order_id populated
- Verify Slack fill confirmation fires to #trade-alerts

## Known Issues
- decisions.reasoning JSON structure has a bug -- bearishFactors and
  bullishFactors arrays duplicate the summary text instead of containing
  distinct factors. Prompt engineering fix needed. Flagged for future session.
- fillPrice returns 0 from placeOrder -- market orders on Tradier sandbox
  do not return fill price immediately. Fetching actual fill price is
  Phase 7 follow-up work after first successful paper trade confirmed.

## Next Session Starting Point
When Tradier approves:
  1. Add TRADIER_TOKEN + TRADIER_ACCOUNT_ID to .env and Vercel env vars
  2. Run local test to confirm end-to-end paper trade fires
  3. Confirm Supabase trade row has broker_order_id populated
  4. Confirm Slack fill alert fires
  5. If all pass -- Phase 7 complete, move to Phase 8 (Dashboard)

## Invariants Added This Session
None -- all existing invariants held

## Build Phase Tracker
Phase 1  Monorepo scaffold + shared types        COMPLETE
Phase 2  Data layer (yahoo-finance2 + Supabase)  COMPLETE
Phase 3  Claude decision layer                   COMPLETE
Phase 4  Risk guardrails                         COMPLETE
Phase 5  Orchestrator + Slack alerts             COMPLETE
Phase 6  Vercel cron deployment                  COMPLETE
Phase 7  Broker paper trading execution          IN PROGRESS
Phase 8  Dashboard (agent health + P&L)          PENDING
Phase 9  Live trading + monitoring               PENDING
