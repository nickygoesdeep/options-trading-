# Quant Engine

Production-grade quantitative trading engine for intraday options trading.

## Structure

- `packages/shared` — Shared types (single source of truth)
- `apps/engine` — Trading engine (signals, decision, risk, execution)
- `apps/dashboard` — Dashboard UI
- `supabase/` — Database migrations

## Setup

```bash
npm install
cp .env.example .env
# Fill in your keys in .env
```

## Build Order

1. `npm run build:shared`
2. `npm run build:engine`
3. `npm run build:dashboard`
