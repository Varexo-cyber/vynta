-- 011_onboarding_help.sql
-- Onboarding, help, checklist, tour en assistent analytics tabellen

CREATE TABLE IF NOT EXISTS onboarding_state (
  company_id TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | completed | skipped
  step INT NOT NULL DEFAULT 0,
  goals TEXT[] DEFAULT '{}',
  experience_level TEXT DEFAULT 'normal', -- basic | normal | extensive
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_progress (
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (company_id, task_id)
);

CREATE TABLE IF NOT EXISTS checklist_hidden (
  company_id TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tour_state (
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started | in_progress | completed | skipped
  current_step INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (company_id, tour_id)
);

CREATE TABLE IF NOT EXISTS help_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  article_id TEXT,
  query TEXT,
  helpful BOOLEAN,
  reason TEXT, -- unclear | wrong_steps | not_found | other
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_queries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  matched_article_id TEXT,
  found_match BOOLEAN NOT NULL DEFAULT false,
  context_route TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_preferences (
  company_id TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  assistant_enabled BOOLEAN DEFAULT true,
  product_tips_enabled BOOLEAN DEFAULT true,
  experience_level TEXT DEFAULT 'normal',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_status ON onboarding_state(status);
CREATE INDEX IF NOT EXISTS idx_help_queries_company ON help_queries(company_id);
CREATE INDEX IF NOT EXISTS idx_help_feedback_company ON help_feedback(company_id);
