-- Track which mechanics a customer has used before
CREATE TABLE IF NOT EXISTS customer_mechanic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
  job_count INT DEFAULT 1,
  last_job_at TIMESTAMPTZ DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE,
  UNIQUE(customer_id, mechanic_id)
);

CREATE INDEX IF NOT EXISTS idx_cmh_customer ON customer_mechanic_history(customer_id);
