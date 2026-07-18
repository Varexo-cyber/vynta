-- Berichtacties: verwijderen, doorsturen, vastpinnen

-- Per-user verborgen berichten ("voor mij verwijderen")
CREATE TABLE IF NOT EXISTS message_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  hidden_for_user_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_message_visibility_user ON message_visibility(user_id);

-- Globale verwijdering ("voor iedereen verwijderen")
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by_user_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Doorsturen metadata
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS forwarded_from_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_by_user_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP;

-- Vastgepinde berichten
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by_user_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pinned_until TIMESTAMP NOT NULL,
  UNIQUE (conversation_id, message_id)
);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_conv ON pinned_messages(conversation_id);
