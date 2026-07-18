-- Verrijk berichten met status, bewerken/verwijderen en antwoordreferenties.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_id);

-- Bijlagen bij berichten (metadata; bestanden zelf in object storage).
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  public_url TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'voice')),
  mime_type TEXT,
  original_name TEXT,
  file_size BIGINT,
  width INT,
  height INT,
  duration INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
