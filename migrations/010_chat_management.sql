-- Chatbeheer: archiveren, dempen, blokkeren, rapporteren

-- Gesloten/gearchiveerde chats per bedrijf
CREATE TABLE IF NOT EXISTS archived_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_archived_chats_company ON archived_chats(company_id);

-- Meldingen dempen per conversatie per bedrijf
CREATE TABLE IF NOT EXISTS chat_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  muted_until TIMESTAMPTZ,
  mute_indefinitely BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_mutes_company ON chat_mutes(company_id);

-- Blokkeringen tussen bedrijven
CREATE TABLE IF NOT EXISTS chat_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocker ON chat_blocks(blocker_id);

-- Rapportages
CREATE TABLE IF NOT EXISTS chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'misleiding', 'intimidatie', 'ongepast', 'verdacht', 'fraude', 'anders')),
  details TEXT,
  include_messages BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_reports_reporter ON chat_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status);
