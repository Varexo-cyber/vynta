-- Netwerkherstructurering Vynta (Nederland-only)
-- Verwijdert oude communities en introduceert vaste netwerken: gemeenten, provincies, branches, Heel Nederland.

-- Koppelende tabellen leegmaken
DROP TABLE IF EXISTS need_communities;
DROP TABLE IF EXISTS community_members;
DROP TABLE IF EXISTS communities;

-- Bedrijf krijgt een gemeente-id voor automatische netwerkkoppeling
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS municipality_id TEXT,
  ADD COLUMN IF NOT EXISTS municipality TEXT;

-- Netwerken
DROP TABLE IF EXISTS networks;
CREATE TABLE networks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('municipality', 'province', 'industry', 'national')),
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  province_id TEXT REFERENCES networks(id),
  active BOOLEAN DEFAULT true,
  members INTEGER DEFAULT 0,
  active_today INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networks_type ON networks(type);
CREATE INDEX IF NOT EXISTS idx_networks_province ON networks(province_id);

-- Netwerklidmaatschappen
DROP TABLE IF EXISTS network_members;
CREATE TABLE network_members (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  network_id TEXT REFERENCES networks(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  origin TEXT DEFAULT 'manual' CHECK (origin IN ('onboarding', 'manual', 'system')),
  PRIMARY KEY (company_id, network_id)
);

CREATE INDEX IF NOT EXISTS idx_network_members_company ON network_members(company_id);
CREATE INDEX IF NOT EXISTS idx_network_members_network ON network_members(network_id);

-- Berichten ↔ netwerken
DROP TABLE IF EXISTS post_networks;
CREATE TABLE post_networks (
  post_id UUID REFERENCES needs(id) ON DELETE CASCADE,
  network_id TEXT REFERENCES networks(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, network_id)
);

CREATE INDEX IF NOT EXISTS idx_post_networks_post ON post_networks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_networks_network ON post_networks(network_id);
