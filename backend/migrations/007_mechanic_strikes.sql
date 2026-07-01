-- Mechanic 5-strike policy
-- A strike is issued automatically when a customer leaves a 1 or 2 star review.
-- At 5 strikes the mechanic's account is suspended (users.is_active = false).

ALTER TABLE mechanics
  ADD COLUMN IF NOT EXISTS strike_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
