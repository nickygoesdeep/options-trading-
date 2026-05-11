-- Quant Engine: Initial Schema
-- TODO: Review and adjust column types/constraints before running in production

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('CALL', 'PUT')),
  strike NUMERIC NOT NULL,
  expiry DATE NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed', 'cancelled', 'error')),
  pnl NUMERIC,
  confidence NUMERIC NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  price NUMERIC NOT NULL,
  rsi NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  volume_ratio NUMERIC NOT NULL,
  iv NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id),
  trade_id UUID REFERENCES trades(id),
  verdict TEXT NOT NULL CHECK (verdict IN ('BUY_CALL', 'BUY_PUT', 'HOLD', 'SKIP')),
  confidence NUMERIC NOT NULL,
  reasoning JSONB NOT NULL,
  suggested_strike NUMERIC,
  suggested_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_pnl NUMERIC NOT NULL DEFAULT 0,
  trades_taken INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  last_run TIMESTAMPTZ NOT NULL,
  latency_ms INTEGER NOT NULL,
  error_count INTEGER DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agent_health ENABLE ROW LEVEL SECURITY;
