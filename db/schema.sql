-- Vynta schema (Neon PostgreSQL) — synced with live DB

CREATE TABLE IF NOT EXISTS companies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  handle        text UNIQUE NOT NULL,
  logo_color    text NOT NULL DEFAULT '#6d28d9',
  industry      text NOT NULL DEFAULT '',
  city          text NOT NULL DEFAULT '',
  country       text NOT NULL DEFAULT '',
  description   text NOT NULL DEFAULT '',
  website       text,
  phone         text,
  email         text,
  verified      boolean NOT NULL DEFAULT false,
  rating        numeric(2,1) NOT NULL DEFAULT 0,
  rating_count  integer NOT NULL DEFAULT 0,
  followers     integer NOT NULL DEFAULT 0,
  response_rate integer NOT NULL DEFAULT 100,
  created_at    timestamptz NOT NULL DEFAULT now(),
  address       text,
  postcode      text,
  province      text,
  kvk_number    text,
  vat_number    text,
  logo_url      text,
  lat           numeric,
  lng           numeric
);

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL DEFAULT '',
  role          text NOT NULL DEFAULT 'owner',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token      text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communities (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  kind         text NOT NULL,
  emoji        text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  members      integer NOT NULL DEFAULT 0,
  active_today integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS community_members (
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  community_id text NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, community_id)
);

CREATE TABLE IF NOT EXISTS needs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type       text NOT NULL,
  body       text NOT NULL,
  quantity   text,
  budget     text,
  has_image  boolean NOT NULL DEFAULT false,
  status     text NOT NULL DEFAULT 'open',
  responses  integer NOT NULL DEFAULT 0,
  views      integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  image_url  text,
  video_url  text
);

CREATE TABLE IF NOT EXISTS need_communities (
  need_id      uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  community_id text NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  PRIMARY KEY (need_id, community_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  followee_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_company_id, followee_company_id)
);

CREATE TABLE IF NOT EXISTS saves (
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  need_id    uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, need_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id    uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  need_id    uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind       text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (need_id, company_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id    uuid REFERENCES needs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  last_read_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, company_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind            text NOT NULL DEFAULT 'text',
  body            text NOT NULL,
  meta            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type             text NOT NULL,
  title            text NOT NULL,
  body             text NOT NULL DEFAULT '',
  actor_company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  need_id          uuid REFERENCES needs(id) ON DELETE SET NULL,
  read             boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_needs_created ON needs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_need_comm_comm ON need_communities (community_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_company ON notifications (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_part_company ON conversation_participants (company_id);
