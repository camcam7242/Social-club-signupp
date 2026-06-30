-- Mechanic tier system
ALTER TABLE mechanics
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'basic'
    CHECK (tier IN ('basic', 'certified', 'master')),
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';

-- Allowed job types per tier (enforced in app logic):
-- basic:      flat_tire, battery, oil_change, brakes, wiper_blades, air_filter, jump_start
-- certified:  all of basic + engine_diagnostic, transmission, ac_repair, suspension, electrical
-- master:     all jobs, no restrictions

-- Update document types to include certifications
ALTER TABLE mechanic_documents
  DROP CONSTRAINT IF EXISTS mechanic_documents_document_type_check;

ALTER TABLE mechanic_documents
  ADD CONSTRAINT mechanic_documents_document_type_check
  CHECK (document_type IN ('ase_cert', 'insurance', 'id', 'other', 'manufacturer_cert', 'trade_license', 'ev_cert'));

-- Track cert verification status per document
ALTER TABLE mechanic_documents
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;
