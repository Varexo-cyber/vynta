-- Migration: turn needs into social posts by adding reactions and comments

CREATE TABLE IF NOT EXISTS post_reactions (
  need_id    uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind       text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (need_id, company_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id    uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reactions_need ON post_reactions (need_id);
CREATE INDEX IF NOT EXISTS idx_comments_need ON post_comments (need_id, created_at);

-- Add views counter default is fine; ensure needs has media columns conceptually
ALTER TABLE needs ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE needs ADD COLUMN IF NOT EXISTS video_url text;
