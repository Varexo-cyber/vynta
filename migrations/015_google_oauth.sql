-- Google OpenID Connect account linking and short-lived signup handoff.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS google_subject TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_provider_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_auth_provider_check
      CHECK (auth_provider IN ('password', 'google', 'password_google'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_subject
  ON users(google_subject)
  WHERE google_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS oauth_signup_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  provider_subject TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_oauth_signup_intents_expiry
  ON oauth_signup_intents(expires_at);

DELETE FROM oauth_signup_intents WHERE expires_at <= now();
