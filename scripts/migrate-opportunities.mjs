import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 5,
  prepare: false,
});

async function main() {
  console.log("→ Opportunities migration started");

  await sql`
    CREATE TABLE IF NOT EXISTS service_categories (
      id          TEXT PRIMARY KEY,
      parent_id   TEXT REFERENCES service_categories(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      slug        TEXT NOT NULL,
      level       INT NOT NULL DEFAULT 0,
      sort_order  INT NOT NULL DEFAULT 0,
      active      BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sc_parent ON service_categories(parent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sc_slug ON service_categories(slug)`;

  await sql`
    CREATE TABLE IF NOT EXISTS company_services (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      category_id   TEXT REFERENCES service_categories(id) ON DELETE SET NULL,
      keywords      TEXT[] NOT NULL DEFAULT '{}',
      active        BOOLEAN NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cs_company ON company_services(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cs_category ON company_services(category_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS company_service_areas (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      service_id    UUID REFERENCES company_services(id) ON DELETE CASCADE,
      area_type     TEXT NOT NULL DEFAULT 'radius',
      municipality  TEXT,
      province      TEXT,
      radius_km     INT,
      country       TEXT NOT NULL DEFAULT 'Nederland',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_csa_company ON company_service_areas(company_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS company_opportunity_preferences (
      company_id              UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
      min_budget              NUMERIC(12,2),
      max_distance_km         INT DEFAULT 50,
      min_project_size        TEXT,
      max_project_size        TEXT,
      accepts_urgent          BOOLEAN NOT NULL DEFAULT true,
      accepts_business        BOOLEAN NOT NULL DEFAULT true,
      accepts_consumer        BOOLEAN NOT NULL DEFAULT false,
      accepts_recurring       BOOLEAN NOT NULL DEFAULT true,
      availability_status     TEXT NOT NULL DEFAULT 'available',
      available_from          DATE,
      max_notifications_per_day INT NOT NULL DEFAULT 10,
      notification_frequency  TEXT NOT NULL DEFAULT 'instant',
      quiet_hours_start       TIME DEFAULT '20:00',
      quiet_hours_end         TIME DEFAULT '07:00',
      active                  BOOLEAN NOT NULL DEFAULT true,
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunities (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      opportunity_type  TEXT NOT NULL DEFAULT 'request',
      title             TEXT NOT NULL,
      description       TEXT,
      category_id       TEXT REFERENCES service_categories(id) ON DELETE SET NULL,
      status            TEXT NOT NULL DEFAULT 'draft',
      urgency           TEXT NOT NULL DEFAULT 'normal',
      budget_type       TEXT NOT NULL DEFAULT 'open',
      budget_min        NUMERIC(12,2),
      budget_max        NUMERIC(12,2),
      currency          TEXT NOT NULL DEFAULT 'EUR',
      quantity          TEXT,
      unit              TEXT,
      location_type     TEXT NOT NULL DEFAULT 'on_site',
      municipality      TEXT,
      province          TEXT,
      country           TEXT NOT NULL DEFAULT 'Nederland',
      start_date        DATE,
      end_date          DATE,
      response_deadline TIMESTAMPTZ,
      recurrence_type   TEXT NOT NULL DEFAULT 'one_time',
      visibility_mode   TEXT NOT NULL DEFAULT 'matched_only',
      account_type      TEXT NOT NULL DEFAULT 'business',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      published_at      TIMESTAMPTZ,
      closed_at         TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_opp_company ON opportunities(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_opp_status ON opportunities(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_opp_category ON opportunities(category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_opp_urgency ON opportunities(urgency)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_opp_published ON opportunities(published_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_requirements (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      requirement_key TEXT NOT NULL,
      value_json      JSONB,
      required        BOOLEAN NOT NULL DEFAULT false,
      visibility_level TEXT NOT NULL DEFAULT 'matched',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_or_opp ON opportunity_requirements(opportunity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_attachments (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      storage_key     TEXT NOT NULL,
      media_type      TEXT NOT NULL DEFAULT 'image',
      visibility_level TEXT NOT NULL DEFAULT 'matched',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_oa_opp ON opportunity_attachments(opportunity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_matches (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id    UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      total_score       INT NOT NULL DEFAULT 0,
      category_score    INT NOT NULL DEFAULT 0,
      location_score    INT NOT NULL DEFAULT 0,
      availability_score INT NOT NULL DEFAULT 0,
      budget_score      INT NOT NULL DEFAULT 0,
      timing_score      INT NOT NULL DEFAULT 0,
      preference_score  INT NOT NULL DEFAULT 0,
      quality_score     INT NOT NULL DEFAULT 0,
      history_score     INT NOT NULL DEFAULT 0,
      reason_json       JSONB,
      rule_version      TEXT NOT NULL DEFAULT 'v1',
      round_number      INT NOT NULL DEFAULT 1,
      status            TEXT NOT NULL DEFAULT 'pending',
      matched_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      delivered_at      TIMESTAMPTZ,
      opened_at         TIMESTAMPTZ,
      dismissed_at      TIMESTAMPTZ,
      UNIQUE(opportunity_id, company_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_om_opp ON opportunity_matches(opportunity_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_om_company ON opportunity_matches(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_om_status ON opportunity_matches(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_om_score ON opportunity_matches(total_score DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_distribution_rounds (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      round_number    INT NOT NULL DEFAULT 1,
      started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at    TIMESTAMPTZ,
      target_count    INT NOT NULL DEFAULT 0,
      minimum_score   INT NOT NULL DEFAULT 0,
      radius_km       INT,
      status          TEXT NOT NULL DEFAULT 'pending',
      trigger_reason  TEXT,
      UNIQUE(opportunity_id, round_number)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_dr_opp ON opportunity_distribution_rounds(opportunity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_responses (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id        UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      responding_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      status                TEXT NOT NULL DEFAULT 'interested',
      message               TEXT,
      price_type            TEXT,
      price_min             NUMERIC(12,2),
      price_max             NUMERIC(12,2),
      available_from        DATE,
      attachment_id         UUID REFERENCES opportunity_attachments(id) ON DELETE SET NULL,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
      withdrawn_at          TIMESTAMPTZ,
      UNIQUE(opportunity_id, responding_company_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_res_opp ON opportunity_responses(opportunity_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_res_company ON opportunity_responses(responding_company_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_questions (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id      UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      conversation_id     TEXT,
      asked_by_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_oq_opp ON opportunity_questions(opportunity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_notifications (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      match_id        UUID REFERENCES opportunity_matches(id) ON DELETE CASCADE,
      company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      channel         TEXT NOT NULL DEFAULT 'in_app',
      status          TEXT NOT NULL DEFAULT 'pending',
      sent_at         TIMESTAMPTZ,
      delivered_at    TIMESTAMPTZ,
      opened_at       TIMESTAMPTZ,
      failed_at       TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_on_company ON opportunity_notifications(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_on_opp ON opportunity_notifications(opportunity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_feedback (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      feedback_type   TEXT NOT NULL DEFAULT 'not_relevant',
      reason          TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(opportunity_id, company_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_of_company ON opportunity_feedback(company_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_audit_log (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      actor_user_id   TEXT,
      event_type      TEXT NOT NULL,
      metadata_json   JSONB,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_al_opp ON opportunity_audit_log(opportunity_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_drafts (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      data        JSONB NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_od_company ON opportunity_drafts(company_id)`;

  console.log("✓ All opportunity tables created");

  const categories = [
    { id: "cat-bouw", parent: null, name: "Bouw & Buitenruimte", slug: "bouw-buitenruimte", level: 0, sort: 1 },
    { id: "cat-personeel", parent: null, name: "Personeel & HR", slug: "personeel-hr", level: 0, sort: 2 },
    { id: "cat-inkoop", parent: null, name: "Inkoop & Producten", slug: "inkoop-producten", level: 0, sort: 3 },
    { id: "cat-transport", parent: null, name: "Transport & Logistiek", slug: "transport-logistiek", level: 0, sort: 4 },
    { id: "cat-opslag", parent: null, name: "Opslag & Capaciteit", slug: "opslag-capaciteit", level: 0, sort: 5 },
    { id: "cat-samenwerking", parent: null, name: "Samenwerking", slug: "samenwerking", level: 0, sort: 6 },
    { id: "cat-productie", parent: null, name: "Productie & Vervaardiging", slug: "productie-vervaardiging", level: 0, sort: 7 },
    { id: "cat-vastgoed", parent: null, name: "Vastgoed & Ruimte", slug: "vastgoed-ruimte", level: 0, sort: 8 },
    { id: "cat-tech", parent: null, name: "Technologie & Software", slug: "technologie-software", level: 0, sort: 9 },
    { id: "cat-marketing", parent: null, name: "Marketing & Communicatie", slug: "marketing-communicatie", level: 0, sort: 10 },
    { id: "cat-financieel", parent: null, name: "Financieel & Juridisch", slug: "financieel-juridisch", level: 0, sort: 11 },
    { id: "cat-overig", parent: null, name: "Overig", slug: "overig", level: 0, sort: 99 },
    { id: "cat-bouw-groen", parent: "cat-bouw", name: "Groenvoorziening", slug: "groenvoorziening", level: 1, sort: 1 },
    { id: "cat-bouw-terras", parent: "cat-bouw-groen", name: "Terrasaanleg", slug: "terrasaanleg", level: 2, sort: 1 },
    { id: "cat-bouw-onderhoud", parent: "cat-bouw-groen", name: "Tuinonderhoud", slug: "tuinonderhoud", level: 2, sort: 2 },
    { id: "cat-bouw-bestrating", parent: "cat-bouw", name: "Bestrating", slug: "bestrating", level: 1, sort: 2 },
    { id: "cat-bouw-verbouw", parent: "cat-bouw", name: "Verbouw & Renovatie", slug: "verbouw-renovatie", level: 1, sort: 3 },
    { id: "cat-bouw-schilder", parent: "cat-bouw", name: "Schilderwerk", slug: "schilderwerk", level: 1, sort: 4 },
    { id: "cat-bouw-dak", parent: "cat-bouw", name: "Dakwerk", slug: "dakwerk", level: 1, sort: 5 },
    { id: "cat-bouw-installatie", parent: "cat-bouw", name: "Installatie & Techniek", slug: "installatie-techniek", level: 1, sort: 6 },
    { id: "cat-pers-logistiek", parent: "cat-personeel", name: "Logistiek personeel", slug: "logistiek-personeel", level: 1, sort: 1 },
    { id: "cat-pers-magazijn", parent: "cat-pers-logistiek", name: "Magazijnmedewerkers", slug: "magazijnmedewerkers", level: 2, sort: 1 },
    { id: "cat-pers-chauffeur", parent: "cat-pers-logistiek", name: "Chauffeurs", slug: "chauffeurs", level: 2, sort: 2 },
    { id: "cat-pers-admin", parent: "cat-personeel", name: "Administratief personeel", slug: "administratief-personeel", level: 1, sort: 2 },
    { id: "cat-pers-tech", parent: "cat-personeel", name: "Technisch personeel", slug: "technisch-personeel", level: 1, sort: 3 },
    { id: "cat-pers-horeca", parent: "cat-personeel", name: "Horecapersoneel", slug: "horecapersoneel", level: 1, sort: 4 },
    { id: "cat-pers-schoonmaak", parent: "cat-personeel", name: "Schoonmaakpersoneel", slug: "schoonmaakpersoneel", level: 1, sort: 5 },
    { id: "cat-inkoop-verpakking", parent: "cat-inkoop", name: "Verpakkingsmateriaal", slug: "verpakkingsmateriaal", level: 1, sort: 1 },
    { id: "cat-inkoop-grondstof", parent: "cat-inkoop", name: "Grondstoffen", slug: "grondstoffen", level: 1, sort: 2 },
    { id: "cat-inkoop-kantoor", parent: "cat-inkoop", name: "Kantoorbenodigdheden", slug: "kantoorbenodigdheden", level: 1, sort: 3 },
    { id: "cat-inkoop-voeding", parent: "cat-inkoop", name: "Voeding & Dranken", slug: "voeding-dranken", level: 1, sort: 4 },
    { id: "cat-inkoop-restpartij", parent: "cat-inkoop", name: "Restpartijen", slug: "restpartijen", level: 1, sort: 5 },
    { id: "cat-trans-spoed", parent: "cat-transport", name: "Spoedtransport", slug: "spoedtransport", level: 1, sort: 1 },
    { id: "cat-trans-distributie", parent: "cat-transport", name: "Distributie", slug: "distributie", level: 1, sort: 2 },
    { id: "cat-trans-internationaal", parent: "cat-transport", name: "Internationaal transport", slug: "internationaal-transport", level: 1, sort: 3 },
    { id: "cat-trans-koel", parent: "cat-transport", name: "Koel- en vriestransport", slug: "koel-vriestransport", level: 1, sort: 4 },
    { id: "cat-opslag-tijdelijk", parent: "cat-opslag", name: "Tijdelijke opslag", slug: "tijdelijke-opslag", level: 1, sort: 1 },
    { id: "cat-opslag-koud", parent: "cat-opslag", name: "Koelopslag", slug: "koelopslag", level: 1, sort: 2 },
    { id: "cat-opslag-capaciteit", parent: "cat-opslag", name: "Productiecapaciteit", slug: "productiecapaciteit", level: 1, sort: 3 },
    { id: "cat-samen-onderaannemer", parent: "cat-samenwerking", name: "Onderaanneming", slug: "onderaanneming", level: 1, sort: 1 },
    { id: "cat-samen-partner", parent: "cat-samenwerking", name: "Strategische samenwerking", slug: "strategische-samenwerking", level: 1, sort: 2 },
    { id: "cat-prod-metaal", parent: "cat-productie", name: "Metaalbewerking", slug: "metaalbewerking", level: 1, sort: 1 },
    { id: "cat-prod-hout", parent: "cat-productie", name: "Houtbewerking", slug: "houtbewerking", level: 1, sort: 2 },
    { id: "cat-prod-plastic", parent: "cat-productie", name: "Plasticverwerking", slug: "plasticverwerking", level: 1, sort: 3 },
    { id: "cat-vast-kantoor", parent: "cat-vastgoed", name: "Kantoorruimte", slug: "kantoorruimte", level: 1, sort: 1 },
    { id: "cat-vast-bedrijf", parent: "cat-vastgoed", name: "Bedrijfsruimte", slug: "bedrijfsruimte", level: 1, sort: 2 },
    { id: "cat-tech-website", parent: "cat-tech", name: "Website & Webshop", slug: "website-webshop", level: 1, sort: 1 },
    { id: "cat-tech-software", parent: "cat-tech", name: "Software ontwikkeling", slug: "software-ontwikkeling", level: 1, sort: 2 },
    { id: "cat-tech-it", parent: "cat-tech", name: "IT & Infrastructuur", slug: "it-infrastructuur", level: 1, sort: 3 },
    { id: "cat-mkt-design", parent: "cat-marketing", name: "Design & Branding", slug: "design-branding", level: 1, sort: 1 },
    { id: "cat-mkt-content", parent: "cat-marketing", name: "Content & Social Media", slug: "content-social-media", level: 1, sort: 2 },
    { id: "cat-mkt-seo", parent: "cat-marketing", name: "SEO & Online marketing", slug: "seo-online-marketing", level: 1, sort: 3 },
    { id: "cat-fin-boekhouding", parent: "cat-financieel", name: "Boekhouding & Administratie", slug: "boekhouding-administratie", level: 1, sort: 1 },
    { id: "cat-fin-juridisch", parent: "cat-financieel", name: "Juridisch", slug: "juridisch", level: 1, sort: 2 },
    { id: "cat-fin-verzekering", parent: "cat-financieel", name: "Verzekeringen", slug: "verzekeringen", level: 1, sort: 3 },
    { id: "cat-overig-catering", parent: "cat-overig", name: "Catering", slug: "catering", level: 1, sort: 1 },
    { id: "cat-overig-beveiliging", parent: "cat-overig", name: "Beveiliging", slug: "beveiliging", level: 1, sort: 2 },
    { id: "cat-overig-schoonmaak", parent: "cat-overig", name: "Schoonmaak", slug: "schoonmaak", level: 1, sort: 3 },
  ];

  for (const c of categories) {
    await sql`
      INSERT INTO service_categories (id, parent_id, name, slug, level, sort_order)
      VALUES (${c.id}, ${c.parent}, ${c.name}, ${c.slug}, ${c.level}, ${c.sort})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, sort_order = EXCLUDED.sort_order
    `;
  }
  console.log(`✓ ${categories.length} service categories seeded`);

  await sql`
    INSERT INTO company_opportunity_preferences (company_id)
    SELECT id FROM companies
    WHERE id NOT IN (SELECT company_id FROM company_opportunity_preferences)
  `;
  console.log("✓ Default preferences created for existing companies");

  console.log("→ Opportunities migration complete");
  await sql.end();
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
