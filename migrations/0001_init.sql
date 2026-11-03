-- Leads from the contact form.
CREATE TABLE IF NOT EXISTS leads (
  id          TEXT PRIMARY KEY,
  created_at  INTEGER NOT NULL,           -- unix seconds
  region      TEXT NOT NULL CHECK (region IN ('ae','in')),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  company     TEXT,
  service     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' -- new | contacted | won | lost
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

-- Hashed IPs for rate limiting only. Rows older than 24h are deleted on every submit.
CREATE TABLE IF NOT EXISTS rate_events (
  ip_hash     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate ON rate_events(ip_hash, created_at);
