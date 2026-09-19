-- 016_kvk_unique_and_review.sql
-- Een account per KVK, en een reviewstatus voor bedrijven zonder KVK.
--
-- WAAROM DIT NODIG IS. `kvk_number` was een vrij tekstveld: optioneel, zonder
-- vorm en zonder uniciteit. Twee accounts konden hetzelfde KVK-nummer voeren,
-- of "12345678" en "1234 5678" naast elkaar hebben. Zodra Vynta bedrijven gaat
-- matchen is dat direct een probleem -- dan stuur je dezelfde aanvraag twee keer
-- naar hetzelfde bedrijf en weet je niet welk account de echte is.
--
-- DE GENORMALISEERDE KOLOM DOET HET WERK. `kvk_number` houdt wat de gebruiker
-- intikte; `kvk_normalized` houdt alleen de cijfers. De unieke index staat op de
-- genormaliseerde variant, zodat spaties, punten en "KVK " ervoor geen tweede
-- account kunnen opleveren.
--
-- NULL BOTST NIET IN POSTGRES, en dat is precies goed: bedrijven zonder KVK
-- mogen bestaan, meerdere zelfs. Die gaan de reviewstroom in.

ALTER TABLE companies ADD COLUMN IF NOT EXISTS kvk_normalized TEXT;

-- Bestaande rijen meenemen: alleen cijfers overhouden, leeg wordt NULL.
UPDATE companies
   SET kvk_normalized = NULLIF(regexp_replace(COALESCE(kvk_number, ''), '\D', '', 'g'), '')
 WHERE kvk_normalized IS NULL;

-- EERST CONTROLEREN, DAN PAS AFDWINGEN.
--
-- Staan er al dubbele nummers in, dan faalt de unieke index met een melding
-- waar niemand iets aan heeft. Deze controle noemt de nummers zelf, zodat je ze
-- met de hand kunt oplossen in plaats van te moeten raden.
DO $$
DECLARE dubbel TEXT;
BEGIN
  SELECT string_agg(kvk_normalized, ', ')
    INTO dubbel
    FROM (SELECT kvk_normalized
            FROM companies
           WHERE kvk_normalized IS NOT NULL
           GROUP BY kvk_normalized
          HAVING count(*) > 1) d;
  IF dubbel IS NOT NULL THEN
    RAISE EXCEPTION
      'Deze KVK-nummers staan meer dan een keer in companies: %. Voeg de accounts eerst samen of maak er een leeg.', dubbel;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_kvk_normalized
    ON companies (kvk_normalized)
 WHERE kvk_normalized IS NOT NULL;

-- DE REVIEWSTATUS.
--
-- 'approved'  = KVK opgegeven en uniek, verder niets aan de hand
-- 'pending'   = handmatig ingevoerd zonder KVK; het account WERKT gewoon, maar
--               staat onder review en de eigenaar krijgt er bericht van
-- 'rejected'  = afgekeurd na review
--
-- Bewust geen blokkade: iemand die zich aanmeldt moet door kunnen. Een lege
-- wachtkamer is de snelste manier om een nieuwe gebruiker kwijt te raken.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS review_reason TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

CREATE INDEX IF NOT EXISTS idx_companies_review_status
    ON companies (review_status)
 WHERE review_status <> 'approved';

-- BERICHTEN AAN DE BEHEERDER, IN DE DATABASE EN NIET ALLEEN IN DE MAIL.
--
-- info@vynta.nl bestaat nog niet. Zou dit alleen mailen, dan zijn alle
-- aanmeldingen tot die dag stilzwijgend weg. Daarom landt elk bericht EERST
-- hier; versturen is een tweede stap die mag mislukken zonder dat er iets
-- verdwijnt. Zodra de mailbox er is, staat de hele achterstand er nog.
CREATE TABLE IF NOT EXISTS admin_notifications (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kind          TEXT NOT NULL,                  -- 'company_review' | ...
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  recipients    TEXT[] NOT NULL,
  company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed | skipped
  error         TEXT,
  attempts      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status
    ON admin_notifications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_company
    ON admin_notifications (company_id);
