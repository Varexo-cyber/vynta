-- 012_assistant_intelligence.sql
-- Persistent assistant conversations, messages, feedback, memories, embeddings, improvement queue

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nieuw gesprek',
  summary TEXT,
  language TEXT DEFAULT 'nl',
  last_intent TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | archived | deleted
  context_route TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_asst_conv_company ON assistant_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_asst_conv_user ON assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_asst_conv_status ON assistant_conversations(status);
CREATE INDEX IF NOT EXISTS idx_asst_conv_updated ON assistant_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user | assistant | system
  content TEXT NOT NULL,
  intent TEXT,
  confidence REAL,
  source TEXT, -- knowledge_base | conversation_memory | live_application_context | ai_generated | fallback | human_verified
  action_id TEXT,
  article_id TEXT,
  feedback_helpful BOOLEAN,
  feedback_reason TEXT,
  feedback_correction TEXT,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asst_msg_conv ON assistant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_asst_msg_created ON assistant_messages(created_at);

CREATE TABLE IF NOT EXISTS assistant_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL REFERENCES assistant_messages(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  helpful BOOLEAN NOT NULL,
  reason TEXT, -- unclear | wrong_steps | wrong_feature | broken_link | outdated | other
  correction TEXT,
  original_query TEXT,
  original_answer TEXT,
  intent TEXT,
  source TEXT,
  context_route TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asst_fb_company ON assistant_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_asst_fb_helpful ON assistant_feedback(helpful);
CREATE INDEX IF NOT EXISTS idx_asst_fb_message ON assistant_feedback(message_id);

CREATE TABLE IF NOT EXISTS assistant_memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  source_conversation_id TEXT REFERENCES assistant_conversations(id) ON DELETE SET NULL,
  user_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_asst_mem_company ON assistant_memories(company_id);
CREATE INDEX IF NOT EXISTS idx_asst_mem_user ON assistant_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_asst_mem_key ON assistant_memories(memory_key);

CREATE TABLE IF NOT EXISTS assistant_query_embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES assistant_messages(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asst_emb_company ON assistant_query_embeddings(company_id);
CREATE INDEX IF NOT EXISTS idx_asst_emb_conv ON assistant_query_embeddings(conversation_id);

CREATE TABLE IF NOT EXISTS assistant_improvement_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_cluster TEXT NOT NULL,
  example_questions TEXT[] NOT NULL DEFAULT '{}',
  current_answer TEXT,
  current_article_id TEXT,
  failure_reason TEXT, -- no_match | negative_feedback | repeated_correction | broken_action
  negative_feedback_count INT NOT NULL DEFAULT 0,
  correction_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open | reviewed | resolved | blocked
  assigned_to TEXT,
  resolved_answer TEXT,
  resolved_article_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_asst_iq_status ON assistant_improvement_queue(status);
CREATE INDEX IF NOT EXISTS idx_asst_iq_cluster ON assistant_improvement_queue(question_cluster);

-- Extend help_preferences with assistant privacy settings (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_preferences') THEN
    ALTER TABLE help_preferences
      ADD COLUMN IF NOT EXISTS conversation_history_enabled BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS personal_memory_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS share_anonymous_improvement_data BOOLEAN DEFAULT true;
  END IF;
END $$;
