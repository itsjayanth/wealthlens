-- WealthLens Phase-1 schema. Idempotent: safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'advisor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker text NOT NULL DEFAULT 'sharekhan',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  client_code text NOT NULL,
  encrypted_api_key text NOT NULL,
  encrypted_secure_key text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz
);

CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  exchange text NOT NULL DEFAULT 'NSE',
  quantity numeric NOT NULL,
  avg_buy_price numeric NOT NULL,
  last_price numeric NOT NULL,
  sector text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  action text NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
  confidence numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  "timestamp" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES recommendations(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON linked_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id_status ON recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
