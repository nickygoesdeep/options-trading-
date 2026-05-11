ALTER TABLE signals ADD COLUMN IF NOT EXISTS iv NUMERIC;

ALTER TABLE agent_health DROP CONSTRAINT IF EXISTS agent_health_pkey;
ALTER TABLE agent_health ADD COLUMN IF NOT EXISTS service_key TEXT;
ALTER TABLE agent_health ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS agent_health_service_idx ON agent_health(service);

ALTER TABLE decisions DROP CONSTRAINT IF EXISTS decisions_verdict_check;
ALTER TABLE decisions ADD CONSTRAINT decisions_verdict_check
CHECK (verdict IN ('BUY_CALL', 'BUY_PUT', 'HOLD', 'SKIP'));
