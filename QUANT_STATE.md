# Quant Engine -- Live State

> This file is updated at the end of every session.
> It is the single source of truth for current project state.
> Never embed live state in the handoff skill.

---

## Current Phase

**Phase 7 -- Broker Paper Trading (PENDING)**

---

## What Is Working

- All Phase 1-6 complete
- Vercel deployment READY (dpl_5JZn4giZ1nAWB3DmTmoGp6qWx8Uc)
- Cron fires every 5 minutes automatically
- Signal engine pulling real market data
- Claude evaluating signals
- Supabase storing all data
- Slack alerts firing on approved signals
- Confidence threshold at 75% for testing

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
- Vercel deployment configured with cron every 5 minutes

---

## Next Pending Action

**Phase 7 -- Select and integrate paper trading broker**
Options: Tradier (recommended), Tastytrade, IBKR

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
- Last commit: fix: set Vercel outputDirectory for API-only project

---

## Infrastructure

- Supabase: uqcinawuxtnniouckurh
- Vercel: deployed (dpl_5JZn4giZ1nAWB3DmTmoGp6qWx8Uc)
- Slack: quant-engine workspace (#trade-alerts, #agent-health)
- Local run path: C:\Users\Nicholas\options-trading-
