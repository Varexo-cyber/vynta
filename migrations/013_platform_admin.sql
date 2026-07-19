-- Platformbrede owner/admin-rechten, moderatie en audit trail.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS platform_role TEXT NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_platform_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_platform_role_check
      CHECK (platform_role IN ('member', 'admin', 'owner'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_account_status_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_account_status_check
      CHECK (account_status IN ('active', 'suspended', 'deactivated'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES needs(id) ON DELETE SET NULL,
  reporter_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reported_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'misleiding', 'intimidatie', 'ongepast', 'verdacht', 'fraude', 'anders')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  moderator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reports_post ON post_reports(post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_reports_one_open_per_reporter
  ON post_reports(post_id, reporter_company_id)
  WHERE status = 'open' AND post_id IS NOT NULL;

ALTER TABLE chat_reports
  ADD COLUMN IF NOT EXISTS moderator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderator_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

WITH ranked_open_reports AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY reporter_id, reported_id, COALESCE(conversation_id, '00000000-0000-0000-0000-000000000000'::uuid)
           ORDER BY created_at ASC, id ASC
         ) AS position
  FROM chat_reports
  WHERE status = 'open'
)
UPDATE chat_reports report
SET status = 'dismissed',
    moderator_notes = COALESCE(report.moderator_notes, 'Automatisch gesloten: dubbele open melding.'),
    updated_at = now()
FROM ranked_open_reports ranked
WHERE report.id = ranked.id AND ranked.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_reports_one_open_per_reporter
  ON chat_reports(reporter_id, reported_id, COALESCE(conversation_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status = 'open';

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_log(actor_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  email TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  first_failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_locked ON auth_login_attempts(locked_until);
