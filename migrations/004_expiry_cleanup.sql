-- Opruimen van verlopen posts + meldingen voor posts die bijna verlopen
ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS expiry_notified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_needs_expires_at ON needs(expires_at);
CREATE INDEX IF NOT EXISTS idx_needs_expiry_notified ON needs(expiry_notified) WHERE expiry_notified = false;
