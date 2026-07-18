import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import {
  NL_PROVINCES,
  NL_MUNICIPALITIES,
  NL_INDUSTRY_NETWORKS,
} from "@/lib/dutch-networks";

function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] ??= m[2].trim();
    }
  } catch {}
}
loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const usedSlugs = new Set<string>();
function uniqueSlug(base: string) {
  let slug = base;
  let i = 1;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  usedSlugs.add(slug);
  return slug;
}

type DemoCompany = {
  id: string;
  name: string;
  handle: string;
  industry: string;
  city: string;
  province: string;
  municipality: string;
  municipalityId: string;
  description: string;
  color: string;
};

type DemoPost = {
  id: string;
  companyHandle: string;
  type: string;
  body: string;
  quantity?: string;
  budget?: string;
  imageUrl?: string;
  createdAt?: string;
};

const DEMO_COMPANIES: DemoCompany[] = [
  {
    id: "d1a11111-1111-1111-1111-111111111111",
    name: "Bouwbedrijf Van Dijk",
    handle: "bouwbedrijf-van-dijk",
    industry: "Bouw",
    city: "Rotterdam",
    province: "Zuid-Holland",
    municipality: "Rotterdam",
    municipalityId: "gm0599",
    description: "Bouwbedrijf gespecialiseerd in utiliteitsbouw en renovatie in de Rotterdamse regio.",
    color: "#d97706",
  },
  {
    id: "d1a22222-2222-2222-2222-222222222222",
    name: "Logistiek Nederland",
    handle: "logistiek-nederland",
    industry: "Transport & logistiek",
    city: "Tilburg",
    province: "Noord-Brabant",
    municipality: "Tilburg",
    municipalityId: "gm0855",
    description: "Transportbedrijf met capaciteit voor groupage en full-truckloads door heel Nederland.",
    color: "#2563eb",
  },
  {
    id: "d1a33333-3333-3333-3333-333333333333",
    name: "Restaurant De Gouden Lepel",
    handle: "de-gouden-lepel",
    industry: "Horeca & food",
    city: "Amsterdam",
    province: "Noord-Holland",
    municipality: "Amsterdam",
    municipalityId: "gm0363",
    description: "Restaurant in hartje Amsterdam op zoek naar lokale leveranciers en hospitality talent.",
    color: "#be123c",
  },
  {
    id: "d1a44444-4444-4444-4444-444444444444",
    name: "ProductieCo Noord",
    handle: "productieco-noord",
    industry: "Productie",
    city: "Eindhoven",
    province: "Noord-Brabant",
    municipality: "Eindhoven",
    municipalityId: "gm0772",
    description: "Productiebedrijf voor metalen onderdelen en assemblage in de Brainportregio.",
    color: "#4f46e5",
  },
  {
    id: "d1a55555-5555-5555-5555-555555555555",
    name: "TechNova Solutions",
    handle: "technova-solutions",
    industry: "Technologie",
    city: "Utrecht",
    province: "Utrecht",
    municipality: "Utrecht",
    municipalityId: "gm0344",
    description: "Softwarebedrijf uit Utrecht dat SaaS-oplossingen bouwt voor het MKB.",
    color: "#7c3aed",
  },
  {
    id: "d1a66666-6666-6666-6666-666666666666",
    name: "Verpakkingen Plus",
    handle: "verpakkingen-plus",
    industry: "Verpakkingen",
    city: "Arnhem",
    province: "Gelderland",
    municipality: "Arnhem",
    municipalityId: "gm0202",
    description: "Leverancier van duurzame verpakkingsmaterialen voor food en retail.",
    color: "#16a34a",
  },
  {
    id: "d1a77777-7777-7777-7777-777777777777",
    name: "Zorg in Balans",
    handle: "zorg-in-balans",
    industry: "Zorg",
    city: "Groningen",
    province: "Groningen",
    municipality: "Groningen",
    municipalityId: "gm0014",
    description: "Zorgorganisatie actief in Noord-Nederland, op zoek naar samenwerking en personeel.",
    color: "#0891b2",
  },
  {
    id: "d1a88888-8888-8888-8888-888888888888",
    name: "Export Partners NL",
    handle: "export-partners-nl",
    industry: "Import & export",
    city: "Rotterdam",
    province: "Zuid-Holland",
    municipality: "Rotterdam",
    municipalityId: "gm0599",
    description: "Exporteur van Nederlandse producten naar Noordwest-Europa via de Rotterdamse haven.",
    color: "#ea580c",
  },
  {
    id: "d1a99999-9999-9999-9999-999999999999",
    name: "FinAdvies Groep",
    handle: "finadvies-groep",
    industry: "Financieel",
    city: "s-Gravenhage",
    province: "Zuid-Holland",
    municipality: "'s-Gravenhage",
    municipalityId: "gm0518",
    description: "Onafhankelijk financieel adviesbureau voor ondernemers in de regio Den Haag.",
    color: "#0d9488",
  },
  {
    id: "d1abbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    name: "Agrarisch Westland",
    handle: "agrarisch-westland",
    industry: "Agrarisch",
    city: "Westland",
    province: "Zuid-Holland",
    municipality: "Westland",
    municipalityId: "gm1783",
    description: "Teler en leverancier van verse groente en sierteelt uit het Westland.",
    color: "#16a34a",
  },
  {
    id: "d1accccc-cccc-cccc-cccc-cccccccccccc",
    name: "Vastgoed Beheer Midden",
    handle: "vastgoed-midden",
    industry: "Vastgoed",
    city: "Utrecht",
    province: "Utrecht",
    municipality: "Utrecht",
    municipalityId: "gm0344",
    description: "Vastgoedbeheer en projectontwikkeling in Utrecht en omgeving.",
    color: "#6d28d9",
  },
  {
    id: "d1addddd-dddd-dddd-dddd-dddddddddddd",
    name: "Groothandel De Vries",
    handle: "groothandel-de-vries",
    industry: "Groothandel",
    city: "Zwolle",
    province: "Overijssel",
    municipality: "Zwolle",
    municipalityId: "gm0193",
    description: "Groothandel in technische artikelen voor de installatie- en bouwsector.",
    color: "#2563eb",
  },
  {
    id: "d1aeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    name: "EnergieTransitie",
    handle: "energietransitie",
    industry: "Energie & duurzaamheid",
    city: "Leeuwarden",
    province: "Friesland",
    municipality: "Leeuwarden",
    municipalityId: "gm0080",
    description: "Adviesbureau voor duurzame energieoplossingen en subsidies voor bedrijven.",
    color: "#16a34a",
  },
  {
    id: "d1afffff-ffff-ffff-ffff-ffffffffffff",
    name: "Retail Plus Amsterdam",
    handle: "retail-plus-amsterdam",
    industry: "Retail",
    city: "Amsterdam",
    province: "Noord-Holland",
    municipality: "Amsterdam",
    municipalityId: "gm0363",
    description: "Winkelketen in Amsterdam met focus op lokale producten en cadeauartikelen.",
    color: "#be123c",
  },
  {
    id: "d1a00000-0000-0000-0000-000000000001",
    name: "Zakelijke Dienstverlening HQ",
    handle: "zakelijke-dienstverlening-hq",
    industry: "Zakelijke dienstverlening",
    city: "s-Hertogenbosch",
    province: "Noord-Brabant",
    municipality: "'s-Hertogenbosch",
    municipalityId: "gm0796",
    description: "Administratief en juridisch advies voor ondernemers in Brabant.",
    color: "#4f46e5",
  },
];

const DEMO_POSTS: DemoPost[] = [
  {
    id: "d2a11111-1111-1111-1111-111111111111",
    companyHandle: "bouwbedrijf-van-dijk",
    type: "sourcing",
    body: "Wij zoeken voor een project in Rotterdam een betrouwbare leverancier van 500 m² gevelbekleding. Levering binnen 2 weken. Wie kan ons helpen?",
    quantity: "500 m²",
    budget: "Offerte op aanvraag",
  },
  {
    id: "d2a22222-2222-2222-2222-222222222222",
    companyHandle: "logistiek-nederland",
    type: "capacity",
    body: "Vrijdag 18 januari hebben wij nog 12 palletplaatsen beschikbaar op de route Tilburg → Amsterdam. Interesse? Stuur een bericht.",
  },
  {
    id: "d2a33333-3333-3333-3333-333333333333",
    companyHandle: "de-gouden-lepel",
    type: "hiring",
    body: "We zoeken een ervaren sous-chef voor ons restaurant in Amsterdam. Passie voor seizoensgebonden en regionale producten is een must.",
  },
  {
    id: "d2a44444-4444-4444-4444-444444444444",
    companyHandle: "productieco-noord",
    type: "milestone",
    body: "Mijlpaal: onze nieuwe productielijn in Eindhoven is operationeel! Hierdoor kunnen we 40% sneller leveren aan Brabantse partners.",
  },
  {
    id: "d2a55555-5555-5555-5555-555555555555",
    companyHandle: "technova-solutions",
    type: "update",
    body: "Vandaag lanceren wij onze nieuwe module voor automatische factuurverwerking. Speciaal ontwikkeld voor het MKB in Utrecht en omgeving.",
  },
  {
    id: "d2a66666-6666-6666-6666-666666666666",
    companyHandle: "verpakkingen-plus",
    type: "offer",
    body: "Overtollige voorraad: 10.000 kartonnen dozen 30x20x15 cm. Zeer scherpe prijs voor afname in regio Arnhem/Nijmegen.",
  },
  {
    id: "d2a77777-7777-7777-7777-777777777777",
    companyHandle: "zorg-in-balans",
    type: "question",
    body: "Welke software gebruiken collega-zorgorganisaties in Noord-Nederland voor roosterplanning? Wij zijn op zoek naar een praktische oplossing.",
  },
  {
    id: "d2a88888-8888-8888-8888-888888888888",
    companyHandle: "export-partners-nl",
    type: "partnership",
    body: "Wij zoeken Nederlandse producenten van ambachtelijke foodproducten voor export naar Duitsland en België. Samen internationaal groeien?",
  },
  {
    id: "d2a99999-9999-9999-9999-999999999999",
    companyHandle: "finadvies-groep",
    type: "update",
    body: "5 tips voor ondernemers in Den Haag om de energiekosten in 2026 te verlagen. Bekijk ons korte overzicht en vraag gerust door.",
  },
  {
    id: "d2abbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    companyHandle: "agrarisch-westland",
    type: "selling",
    body: "Dit seizoen hebben we een mooie voorraad verse trostomaten beschikbaar voor horeca en retail in regio Westland en Rotterdam.",
  },
  {
    id: "d2accccc-cccc-cccc-cccc-cccccccccccc",
    companyHandle: "vastgoed-midden",
    type: "announcement",
    body: "Nieuwe kantoorruimtes beschikbaar in het centrum van Utrecht. Vanaf 75 m², flexibele huurtermijnen en parkeergelegenheid.",
  },
  {
    id: "d2addddd-dddd-dddd-dddd-dddddddddddd",
    companyHandle: "groothandel-de-vries",
    type: "offer",
    body: "Actie: installatiematerialen voor verwarming en sanitair met korting tot 20%. Alleen deze week voor klanten in Overijssel.",
  },
  {
    id: "d2aeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    companyHandle: "energietransitie",
    type: "question",
    body: "Wie in Friesland heeft ervaring met het aanvragen van de SDE++ subsidie voor zakelijke zonnepanelen? We delen graag kennis.",
  },
  {
    id: "d2afffff-ffff-ffff-ffff-ffffffffffff",
    companyHandle: "retail-plus-amsterdam",
    type: "hiring",
    body: "Wij zoeken een enthousiaste verkoper/verkoopster voor onze winkel in Amsterdam. Ervaring in retail is een pré.",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000001",
    companyHandle: "zakelijke-dienstverlening-hq",
    type: "service",
    body: "Tijdelijke administratieve ondersteuning voor ondernemers in Brabant. Van boekhouding tot loonadministratie.",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000002",
    companyHandle: "bouwbedrijf-van-dijk",
    type: "poll",
    body: "Waar lopen bouwbedrijven in Zuid-Holland het meest tegenaan? Materialen, personeel, planning of vergunningen?",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000003",
    companyHandle: "logistiek-nederland",
    type: "event",
    body: "Netwerkborrel voor logistieke ondernemers in Brabant op 30 januari in Tilburg. Kennis delen en routes optimaliseren.",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000004",
    companyHandle: "technova-solutions",
    type: "update",
    body: "Vacature: junior developer gezocht in Utrecht. Werken aan producten die het MKB echt verder helpen.",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000005",
    companyHandle: "productieco-noord",
    type: "announcement",
    body: "Ons team in Eindhoven zoekt een kwaliteitsmedewerker. Interesse in techniek en precisie? Reageer via een bericht.",
    imageUrl: "https://images.unsplash.com/photo-1565514020176-825b75a3c5a6?w=800&auto=format&fit=crop",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000006",
    companyHandle: "de-gouden-lepel",
    type: "update",
    body: "Nieuw op de kaart: een 4-gangen menu met uitsluitend Nederlandse producten. Reserveringen via ons profiel.",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000007",
    companyHandle: "bouwbedrijf-van-dijk",
    type: "milestone",
    body: "Opgeleverd: 24 nieuwe appartementen in Rotterdam. Trots op het team en de samenwerking met lokale partners.",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000008",
    companyHandle: "zorg-in-balans",
    type: "hiring",
    body: "Verzorgende IG gezocht voor dagdienst in Groningen. Een warm team en goede arbeidsvoorwaarden wachten.",
  },
  {
    id: "d2a00000-0000-0000-0000-000000000009",
    companyHandle: "finadvies-groep",
    type: "partnership",
    body: "Samenwerking gezocht met boekhouders en accountants in regio Den Haag voor gezamenlijke ondernemerssessies.",
  },
  {
    id: "d2a00000-0000-0000-0000-00000000000a",
    companyHandle: "verpakkingen-plus",
    type: "sourcing",
    body: "Wie levert biologisch afbreekbare verpakkingsfolie voor food? Wij testen graag samples voor ons portfolio.",
  },
  {
    id: "d2a00000-0000-0000-0000-00000000000b",
    companyHandle: "export-partners-nl",
    type: "capacity",
    body: "Containercapaciteit beschikbaar Rotterdam → Antwerpen deze week. Neem contact op voor tarieven.",
  },
  {
    id: "d2a00000-0000-0000-0000-00000000000c",
    companyHandle: "agrarisch-westland",
    type: "update",
    body: "De eerste paprika's van het seizoen zijn geoogst. Direct beschikbaar voor groothandel en verwerkers in regio Westland.",
  },
  {
    id: "d2a00000-0000-0000-0000-00000000000d",
    companyHandle: "groothandel-de-vries",
    type: "question",
    body: "Welke merken elektromaterialen gebruiken collega's in de installatiebranche het liefst? We overwegen ons assortiment uit te breiden.",
  },
  {
    id: "d2a00000-0000-0000-0000-00000000000e",
    companyHandle: "vastgoed-midden",
    type: "offer",
    body: "Tijdelijke korting op huurprijs voor start-ups die voor 1 maart een kantoor in Utrecht huren. Informeer naar de mogelijkheden.",
  },
  {
    id: "d2a00000-0000-0000-0000-00000000000f",
    companyHandle: "retail-plus-amsterdam",
    type: "event",
    body: "Lancering nieuwe collectie in Amsterdam. Kom langs op 15 februari voor een borrel en ontdek lokale makers.",
  },
];

function industryNetworkId(industry: string) {
  return `ind-${slugify(industry)}`;
}

function provinceNetworkId(province: string) {
  const p = NL_PROVINCES.find((x) => x.name === province);
  return p ? `prov-${p.code}` : null;
}

async function seedDemo() {
  for (const c of DEMO_COMPANIES) {
    await sql`
      INSERT INTO companies (
        id, name, handle, logo_color, industry, city, province, country,
        municipality, municipality_id, description, verified, rating, rating_count, followers
      )
      VALUES (
        ${c.id}, ${c.name}, ${c.handle}, ${c.color}, ${c.industry}, ${c.city}, ${c.province}, ${"Nederland"},
        ${c.municipality}, ${c.municipalityId}, ${c.description}, ${true}, ${4.5}, ${12}, ${48}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        handle = EXCLUDED.handle,
        logo_color = EXCLUDED.logo_color,
        industry = EXCLUDED.industry,
        city = EXCLUDED.city,
        province = EXCLUDED.province,
        country = EXCLUDED.country,
        municipality = EXCLUDED.municipality,
        municipality_id = EXCLUDED.municipality_id,
        description = EXCLUDED.description,
        verified = EXCLUDED.verified;
    `;

    const networkIds = new Set<string>([c.municipalityId, "nat-nl"]);
    const provId = provinceNetworkId(c.province);
    if (provId) networkIds.add(provId);
    networkIds.add(industryNetworkId(c.industry));

    for (const networkId of networkIds) {
      await sql`
        INSERT INTO network_members (company_id, network_id, origin)
        VALUES (${c.id}, ${networkId}, 'demo')
        ON CONFLICT (company_id, network_id) DO NOTHING;
      `;
    }
  }

  const companyMap = new Map(DEMO_COMPANIES.map((c) => [c.handle, c]));

  for (const p of DEMO_POSTS) {
    const c = companyMap.get(p.companyHandle);
    if (!c) continue;
    const networkIds = new Set<string>([c.municipalityId, "nat-nl"]);
    const provId = provinceNetworkId(c.province);
    if (provId) networkIds.add(provId);
    networkIds.add(industryNetworkId(c.industry));

    await sql`
      INSERT INTO needs (id, company_id, type, body, quantity, budget, image_url, status, created_at, expires_at)
      VALUES (
        ${p.id}, ${c.id}, ${p.type}, ${p.body}, ${p.quantity ?? null}, ${p.budget ?? null}, ${p.imageUrl ?? null},
        ${"open"}, ${new Date(p.createdAt || Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()},
        ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        body = EXCLUDED.body,
        type = EXCLUDED.type,
        quantity = EXCLUDED.quantity,
        budget = EXCLUDED.budget,
        image_url = EXCLUDED.image_url;
    `;

    for (const networkId of networkIds) {
      await sql`
        INSERT INTO post_networks (post_id, network_id)
        VALUES (${p.id}, ${networkId})
        ON CONFLICT (post_id, network_id) DO NOTHING;
      `;
    }
  }

  console.log("Demo bedrijven en posts succesvol geseed.");
}

async function seed() {
  // Verwijder alle buitenlandse bedrijven en hun gekoppelde data
  await sql`
    DELETE FROM companies
    WHERE LOWER(TRIM(country)) NOT IN ('nederland', 'netherlands', 'nl')
  `;

  // Provincies eerst, zodat gemeenten ernaar kunnen refereren
  for (const p of NL_PROVINCES) {
    const id = `prov-${p.code}`;
    await sql`
      INSERT INTO networks (id, name, type, slug, description, active)
      VALUES (
        ${id},
        ${`Provincie ${p.name}`},
        ${"province"},
        ${uniqueSlug(slugify(`provincie-${p.name}`))},
        ${`Netwerk voor bedrijven in de provincie ${p.name}.`},
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        active = EXCLUDED.active;
    `;
  }

  // Gemeenten
  for (const m of NL_MUNICIPALITIES) {
    const provinceCode = NL_PROVINCES.find((p) => p.name === m.province)?.code;
    const provinceId = provinceCode ? `prov-${provinceCode}` : null;
    await sql`
      INSERT INTO networks (id, name, type, slug, description, province_id, active)
      VALUES (
        ${m.id},
        ${`Gemeente ${m.name}`},
        ${"municipality"},
        ${uniqueSlug(slugify(`gemeente-${m.name}`))},
        ${`Netwerk voor bedrijven in de gemeente ${m.name}, ${m.province}.`},
        ${provinceId},
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        province_id = EXCLUDED.province_id,
        active = EXCLUDED.active;
    `;
  }

  // Branchenetwerken
  for (const industry of NL_INDUSTRY_NETWORKS) {
    const id = `ind-${slugify(industry)}`;
    await sql`
      INSERT INTO networks (id, name, type, slug, description, active)
      VALUES (
        ${id},
        ${industry},
        ${"industry"},
        ${uniqueSlug(slugify(industry))},
        ${`Branchenetwerk voor ${industry.toLowerCase()}.`},
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        active = EXCLUDED.active;
    `;
  }

  // Landelijk netwerk
  await sql`
    INSERT INTO networks (id, name, type, slug, description, active)
    VALUES (
      'nat-nl',
      'Heel Nederland',
      'national',
      'heel-nederland',
      'Het landelijke netwerk voor alle Nederlandse bedrijven.',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      active = EXCLUDED.active;
  `;

  console.log("Netwerken succesvol geseed.");
  await seedDemo();
  await updateNetworkCounts();
  await sql.end();
}

async function updateNetworkCounts() {
  await sql`
    UPDATE networks n
    SET members = (
      SELECT COUNT(*) FROM network_members nm WHERE nm.network_id = n.id
    );
  `;
  await sql`
    UPDATE networks
    SET active_today = GREATEST(1, FLOOR(members * 0.18));
  `;
  console.log("Netwerk tellingen bijgewerkt.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
