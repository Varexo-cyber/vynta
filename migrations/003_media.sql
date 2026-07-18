-- Media & link-previews uitbreiding
ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS link_data JSONB;
