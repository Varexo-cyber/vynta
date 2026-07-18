-- Migration: location-first Vynta

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS kvk_number text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;

-- Drop corporate fields we no longer use
ALTER TABLE companies DROP COLUMN IF EXISTS response_rate;

-- Ensure common location communities exist
INSERT INTO communities (id, name, kind, emoji, description, members)
VALUES
  ('c-nl', 'Nederland', 'country', '🇳🇱', 'Alle bedrijven in Nederland', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO communities (id, name, kind, emoji, description, members)
VALUES
  ('p-zuid-holland', 'Zuid-Holland', 'province', '📍', 'Bedrijven in Zuid-Holland', 0),
  ('p-noord-holland', 'Noord-Holland', 'province', '📍', 'Bedrijven in Noord-Holland', 0),
  ('p-noord-brabant', 'Noord-Brabant', 'province', '📍', 'Bedrijven in Noord-Brabant', 0),
  ('p-utrecht', 'Utrecht', 'province', '📍', 'Bedrijven in Utrecht', 0),
  ('p-limburg', 'Limburg', 'province', '📍', 'Bedrijven in Limburg', 0),
  ('p-gelderland', 'Gelderland', 'province', '📍', 'Bedrijven in Gelderland', 0),
  ('p-overijssel', 'Overijssel', 'province', '📍', 'Bedrijven in Overijssel', 0),
  ('p-friesland', 'Friesland', 'province', '📍', 'Bedrijven in Friesland', 0),
  ('p-groningen', 'Groningen', 'province', '📍', 'Bedrijven in Groningen', 0),
  ('p-drenthe', 'Drenthe', 'province', '📍', 'Bedrijven in Drenthe', 0),
  ('p-zeeland', 'Zeeland', 'province', '📍', 'Bedrijven in Zeeland', 0),
  ('p-flevoland', 'Flevoland', 'province', '📍', 'Bedrijven in Flevoland', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO communities (id, name, kind, emoji, description, members)
VALUES
  ('ct-rotterdam', 'Rotterdam', 'city', '📍', 'Bedrijven in Rotterdam', 0),
  ('ct-amsterdam', 'Amsterdam', 'city', '📍', 'Bedrijven in Amsterdam', 0),
  ('ct-eindhoven', 'Eindhoven', 'city', '📍', 'Bedrijven in Eindhoven', 0),
  ('ct-den-haag', 'Den Haag', 'city', '📍', 'Bedrijven in Den Haag', 0),
  ('ct-utrecht', 'Utrecht', 'city', '📍', 'Bedrijven in Utrecht', 0),
  ('ct-tilburg', 'Tilburg', 'city', '📍', 'Bedrijven in Tilburg', 0),
  ('ct-groningen', 'Groningen', 'city', '📍', 'Bedrijven in Groningen', 0),
  ('ct-arnhem', 'Arnhem', 'city', '📍', 'Bedrijven in Arnhem', 0),
  ('ct-breda', 'Breda', 'city', '📍', 'Bedrijven in Breda', 0),
  ('ct-nijmegen', 'Nijmegen', 'city', '📍', 'Bedrijven in Nijmegen', 0)
ON CONFLICT (id) DO NOTHING;
