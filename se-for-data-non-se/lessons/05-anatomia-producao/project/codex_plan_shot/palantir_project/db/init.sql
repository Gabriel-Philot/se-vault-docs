CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  mission_type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heroes (
  hero_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  stage TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  label TEXT NOT NULL,
  entity_id TEXT NULL,
  latency_ms INTEGER NULL,
  payload_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO heroes (hero_key, display_name, score)
VALUES
  ('aragorn', 'Aragorn', 120),
  ('legolas', 'Legolas', 110),
  ('gimli', 'Gimli', 105),
  ('gandalf', 'Gandalf', 150),
  ('frodo', 'Frodo', 95),
  ('samwise', 'Samwise', 98),
  ('boromir', 'Boromir', 88),
  ('eowyn', 'Eowyn', 100),
  ('faramir', 'Faramir', 92),
  ('galadriel', 'Galadriel', 170)
ON CONFLICT (hero_key) DO NOTHING;
