# Quant Engine -- Live State

> This file is updated at the end of every session.
> It is the single source of truth for current project state.
> Never embed live state in the handoff skill.

---

## Current Phase

**Phase 6 -- Vercel Cron Deployment (PENDING)**

---

## What Is Working

- Signal engine pulls real market data via yahoo-finance2
- RSI, IV, and volume ratio calculated correctly
- Claude evaluates signals and returns structured decisions
- Risk guardrails enforce capital protection rules
- Supabase stores signals, decisions, and agent health
- Slack alerts fire to #trade-alerts on approved signals
- Engine runs clean locally via test-run.ts
- Confidence threshold set to 75% for testing (revert to 85% after proof)

---

## Current Known Issues

- `[env] Could not load .env file` warning on every run (harmless -- --env-file flag handles loading)
- smartMoney.ts is still a placeholder (Phase 2 incomplete)
- signal_id not linking correctly in decisions table (null foreign key)
- Low volume ratios during early market hours (0.10-0.21) causing conservative signals
- broker.ts is placeholder only -- no trades execute yet

---

## Last Session Decisions

- Monorepo structure chosen over standalone repos
- TypeScript strict mode with ESM modules (NodeNext)
- yahoo-finance2 used via ESM import (not CommonJS)
- Confidence threshold set to 75% temporarily for testing
- Volume ratio causing conservative Claude behavior during low-volume periods
- Supabase schema fixed directly via MCP connector
- Run command established: `node --env-file=C:\Users\Nicholas\options-trading-\.env --import tsx/esm src/test-run.ts`

---

## Next Pending Action

**Phase 6 -- Vercel Deployment**
1. Create Vercel project from GitHub repo
2. Add all environment variables to Vercel
3. Create Vercel cron job (every 5 min, market hours)
4. Deploy and verify cron fires correctly
5. Confirm signals appear in Supabase on schedule

---

## Milestone Tracker

```
Paper trading signal track record:   0 / 10 consecutive wins needed
Confidence threshold:                75% (testing) -- revert to 85%
Capital deployed:                    $0 (paper only)
Real money unlock:                   After 10 consecutive winning signals
```

---

## GitHub

- Repo: nickygoesdeep/options-trading-
- Branch: main
- Last commit: feat: engine running clean -- signals flowing, Claude evaluating, Slack alerts firing

---

## Infrastructure

- Supabase: uqcinawuxtnniouckurh
- Vercel: not yet connected
- Slack: quant-engine workspace (#trade-alerts, #agent-health)
- Local run path: C:\Users\Nicholas\options-trading-
