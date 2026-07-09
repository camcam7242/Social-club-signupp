-- Heavy-equipment capability: mechanics with a garage, trailer lift, or
-- transmission jack can take transmission_major and similar heavy jobs.
ALTER TABLE mechanics
  ADD COLUMN IF NOT EXISTS has_garage BOOLEAN NOT NULL DEFAULT FALSE;
