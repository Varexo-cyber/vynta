// Vynta DB setup: run schema + seed demo data on Neon.
// Usage: node scripts/setup-db.mjs
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// --- Load .env.local manually ---
function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
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

const now = Date.now();
const H = 3600_000;
const D = 24 * H;
const ago = (ms) => new Date(now - ms);
const ahead = (ms) => new Date(now + ms);

const communities = [
  ["c-nl", "Nederland", "country", "🇳🇱", "Bedrijven die actief zijn in Nederland.", 48213, 1290],
  ["i-packaging", "Verpakkingen", "industry", "📦", "Dozen, materialen, verpakkingsleveranciers & -kopers.", 21044, 640],
  ["i-manufacturing", "Productie", "industry", "🏭", "Fabrieken en productie.", 55210, 1920],
  ["i-transport", "Transport & Logistiek", "industry", "🚚", "Vracht, verzending en logistiek.", 40122, 1510],
  ["i-construction", "Bouw", "industry", "🏗️", "Bouwmaterialen en aannemers.", 38900, 1330],
  ["i-retail", "Retail", "industry", "🛍️", "Retailers en groothandels.", 47021, 1610],
  ["i-restaurants", "Horeca & Food", "industry", "🍽️", "Foodservice en horeca.", 33210, 990],
  ["i-tech", "Technologie", "industry", "💻", "Software, hardware en IT-diensten.", 88410, 4120],
  ["i-health", "Zorg", "industry", "🩺", "Medisch, farma en zorgdiensten.", 29900, 870],
  ["t-import", "Import", "topic", "🛳️", "Importeurs en inkoop over de grens.", 19004, 520],
  ["t-export", "Export", "topic", "🌍", "Exporteurs op zoek naar nieuwe markten.", 20431, 610],
  ["t-ai", "AI", "topic", "🤖", "Toegepaste AI voor het bedrijfsleven.", 51200, 3010],
  ["t-sustainability", "Duurzaamheid", "topic", "🌱", "Groen ondernemen en circulaire economie.", 24100, 720],
];

const companies = [
  { key: "meridian", name: "Meridian Trading Co.", handle: "meridian", color: "#6d28d9", industry: "Import / Export", city: "Rotterdam", country: "Nederland", desc: "Wij kopen en distribueren industriële goederen door heel Nederland en de grensregio's. Al 12 jaar verbinden we fabrikanten met kopers.", website: "meridiantrading.nl", phone: "+31 10 123 4567", email: "hello@meridiantrading.nl", verified: true, rating: 4.8, ratingCount: 214, followers: 3820, responseRate: 96, communities: ["c-nl", "i-packaging", "t-import", "t-export"], products: [["Industriële verpakkingen", "Bulkdozen, pallets en folie."], ["Inkoopservice", "Wij vinden leveranciers voor lastig verkrijgbare goederen."]] },
  { key: "noordpakket", name: "NoordPakket", handle: "noordpakket", color: "#16a34a", industry: "Verpakkingen", city: "Utrecht", country: "Nederland", desc: "Fabrikant van duurzame kartonnen en golfkartonnen verpakkingen.", website: "noordpakket.nl", verified: true, rating: 4.7, ratingCount: 158, followers: 2210, responseRate: 92, communities: ["c-nl", "i-packaging", "t-sustainability"], products: [["Golfkartonnen dozen", "Maatwerkformaten, FSC-gecertificeerd."]] },
  { key: "sneltransport", name: "SnelTransport NL", handle: "sneltransport", color: "#0891b2", industry: "Transport & Logistiek", city: "Tilburg", country: "Nederland", desc: "Nationaal wegtransport met realtime tracking en een groeiende vloot.", verified: true, rating: 4.6, ratingCount: 302, followers: 4120, responseRate: 89, communities: ["c-nl", "i-transport", "t-export"], products: [["Wegtransport", "FTL & LTL door heel Nederland."]] },
  { key: "smaakmakers", name: "Smaakmakers Groothandel", handle: "smaakmakers", color: "#d97706", industry: "Horeca & Food", city: "Amsterdam", country: "Nederland", desc: "Groothandel in premium ingrediënten voor restaurants en horeca.", verified: false, rating: 4.4, ratingCount: 61, followers: 980, responseRate: 78, communities: ["c-nl", "i-restaurants"], products: [["Fijne ingrediënten", "Ingekocht bij Nederlandse producenten."]] },
  { key: "helix", name: "Helix Manufacturing", handle: "helix", color: "#2563eb", industry: "Productie", city: "Eindhoven", country: "Nederland", desc: "Precisie CNC-verspaning en metaalbewerking.", verified: true, rating: 4.9, ratingCount: 143, followers: 3010, responseRate: 98, communities: ["c-nl", "i-manufacturing"], products: [["CNC-verspaning", "Van prototype tot productieseries."]] },
  { key: "datalinqs", name: "DataLinqs", handle: "datalinqs", color: "#7c3aed", industry: "Technologie", city: "Utrecht", country: "Nederland", desc: "Wij bouwen toegepaste AI-tools voor supply chains.", website: "datalinqs.nl", verified: true, rating: 4.8, ratingCount: 44, followers: 5600, responseRate: 94, communities: ["c-nl", "i-tech", "t-ai"], products: [["Vraagvoorspelling", "AI-voorspellingen voor voorraad."]] },
  { key: "bouwteamzuid", name: "BouwTeam Zuid", handle: "bouwteamzuid", color: "#ea580c", industry: "Bouw", city: "Breda", country: "Nederland", desc: "Specialisten in commerciële bouw en afbouw in Brabant.", verified: false, rating: 4.3, ratingCount: 77, followers: 1240, responseRate: 71, communities: ["c-nl", "i-construction"], products: [["Afbouwdiensten", "Inrichting van kantoor & retail."]] },
  { key: "winkelplein", name: "Winkelplein Nederland", handle: "winkelplein", color: "#0d9488", industry: "Retail", city: "Amsterdam", country: "Nederland", desc: "Multi-brand retailer met winkels in heel Nederland.", verified: true, rating: 4.5, ratingCount: 190, followers: 2760, responseRate: 85, communities: ["c-nl", "i-retail"], products: [["Private label", "White-label consumentenproducten."]] },
];

const needs = [
  { key: "n1", co: "noordpakket", type: "sourcing", body: "Wij zoeken 50.000 golfkartonnen dozen (400×300×300mm), dubbelwandig, FSC-gecertificeerd. Terugkerende maandorder. Levering in Utrecht.", quantity: "50.000 stuks / maand", budget: "€0,80–1,10 / stuk", communities: ["i-packaging", "c-nl"], status: "open", responses: 7, views: 1840, created: ago(2 * H), expires: ahead(5 * D) },
  { key: "n2", co: "sneltransport", type: "capacity", body: "Wij hebben retourvracht-capaciteit Tilburg → Eindhoven, elke dinsdag en vrijdag. 12 pallets beschikbaar tegen gereduceerd tarief.", quantity: "12 pallets / rit", communities: ["i-transport"], status: "open", responses: 3, views: 920, created: ago(5 * H), expires: ahead(3 * D) },
  { key: "n3", co: "helix", type: "selling", body: "Overtollige voorraad te koop: 8.000 aluminium beugels (grade 6061), restant van een geannuleerde order. Scherp geprijsd, ophalen in Eindhoven.", quantity: "8.000 stuks", budget: "€2,40 / stuk (was €4,10)", image: true, communities: ["i-manufacturing", "c-nl"], status: "open", responses: 12, views: 2600, created: ago(9 * H), expires: ahead(2 * D) },
  { key: "n4", co: "datalinqs", type: "announcement", body: "We breiden uit binnen Nederland. In Q3 openen we een kantoor in Amsterdam en werven we een lokaal team.", communities: ["t-ai", "c-nl", "i-tech"], status: "open", responses: 5, views: 4100, created: ago(1 * D), expires: ahead(6 * D) },
  { key: "n5", co: "smaakmakers", type: "sourcing", body: "Op zoek naar een betrouwbare leverancier van biologische zonnebloemolie, 5.000L per maand, geschikt voor private label. Levering in Amsterdam.", quantity: "5.000 L / maand", communities: ["i-restaurants", "c-nl", "t-import"], status: "in_conversation", responses: 9, views: 1520, created: ago(1 * D + 3 * H), expires: ahead(4 * D) },
  { key: "n6", co: "bouwteamzuid", type: "hiring", body: "Wij werven 6 ervaren bouwelektriciens voor een commercieel project van 9 maanden in Breda. Directe start, scherp dagtarief.", communities: ["i-construction", "c-nl"], status: "open", responses: 4, views: 780, created: ago(1 * D + 8 * H), expires: ahead(9 * D) },
  { key: "n7", co: "winkelplein", type: "partnership", body: "Op zoek naar distributiepartners voor onze private-label huishoudlijn in België en Luxemburg. Aantrekkelijke marges voor het juiste retailnetwerk.", communities: ["i-retail", "c-nl"], status: "open", responses: 6, views: 1310, created: ago(2 * D), expires: ahead(7 * D) },
  { key: "n8", co: "datalinqs", type: "service", body: "Wij bieden AI-vraagvoorspelling als managed service. We koppelen met je ERP en verlagen nee-verkopen met ~30%. Gratis pilot van 2 weken voor fabrikanten.", communities: ["t-ai", "i-manufacturing", "i-tech"], status: "open", responses: 8, views: 2210, created: ago(2 * D + 6 * H), expires: ahead(10 * D) },
  { key: "n9", co: "sneltransport", type: "investment", body: "Wij halen een ronde van €4M op om 120 elektrische trucks aan onze vloot toe te voegen. Op zoek naar strategische investeerders in groene logistiek. Deck op aanvraag.", budget: "€4M ronde", communities: ["i-transport", "t-sustainability"], status: "open", responses: 2, views: 3400, created: ago(3 * D), expires: ahead(12 * D) },
  { key: "n10", co: "meridian", type: "sourcing", body: "Wij zoeken een Nederlandse leverancier van biologisch afbreekbaar opvulmateriaal voor e-commerce. Monsters beschikbaar, recyclebaar. Start met 2 pallets/week.", quantity: "2 pallets / week", communities: ["i-packaging", "t-sustainability", "c-nl"], status: "open", responses: 4, views: 640, created: ago(6 * H), expires: ahead(6 * D) },
];

const conversations = [
  { with: "noordpakket", need: "n1", unread: 2, messages: [
    { from: "noordpakket", kind: "text", body: "Hoi — we zagen jullie reactie op onze aanvraag voor dozen. Halen jullie de dubbelwandige specificatie?", time: ago(3 * H) },
    { from: "meridian", kind: "text", body: "Zeker. We produceren FSC dubbelwandig in dat formaat. Ik stuur onze specificatiesheet mee.", time: ago(2.5 * H) },
    { from: "meridian", kind: "document", body: "NoordPakket_Specsheet.pdf", meta: "PDF · 1,2 MB", time: ago(2.5 * H) },
    { from: "noordpakket", kind: "text", body: "Top. Wat is jullie levertijd voor de eerste 50k en de prijs bij dat volume?", time: ago(40 * 60000) },
    { from: "noordpakket", kind: "text", body: "We willen graag volgende maand starten als het past.", time: ago(38 * 60000) },
  ] },
  { with: "sneltransport", need: "n2", unread: 0, messages: [
    { from: "sneltransport", kind: "text", body: "Retourvracht Tilburg→Eindhoven is deze vrijdag beschikbaar als je het nog nodig hebt.", time: ago(6 * H) },
    { from: "meridian", kind: "text", body: "Perfecte timing. We hebben 6 pallets. Wat is het tarief?", time: ago(5 * H) },
    { from: "sneltransport", kind: "location", body: "Ophalen: De Helftheuvelweg 5, Tilburg", time: ago(4.5 * H) },
  ] },
  { with: "helix", need: null, unread: 1, messages: [
    { from: "meridian", kind: "text", body: "Interesse in de overtollige aluminium beugels — zijn ze nog beschikbaar?", time: ago(8 * H) },
    { from: "helix", kind: "image", body: "Foto van beugels", time: ago(7 * H) },
    { from: "helix", kind: "text", body: "Ja, nog ~8.000 over. €2,40/stuk voor de hele partij kan.", time: ago(20 * 60000) },
  ] },
  { with: "datalinqs", need: null, unread: 0, messages: [
    { from: "datalinqs", kind: "text", body: "Welkom bij Vynta! Wil je onze gratis forecasting-pilot proberen?", time: ago(1 * D) },
    { from: "meridian", kind: "text", body: "Misschien nadat we de verpakkingsinkoop hebben geregeld. Laten we volgende week praten.", time: ago(22 * H) },
  ] },
];

const notifications = [
  { type: "response", actor: "noordpakket", title: "NoordPakket reageerde", body: "op je behoefte “biologisch afbreekbaar opvulmateriaal”.", need: "n10", read: false, time: ago(35 * 60000) },
  { type: "match", actor: "helix", title: "Nieuwe match in Verpakkingen", body: "Helix Manufacturing plaatste een inkoop-behoefte die past bij jouw producten.", need: "n3", read: false, time: ago(2 * H) },
  { type: "expiry", actor: null, title: "Je behoefte verloopt binnenkort", body: "“biologisch afbreekbaar opvulmateriaal” heeft nog 2 dagen. Een boost geven?", need: "n10", read: false, time: ago(4 * H) },
  { type: "follow", actor: "winkelplein", title: "Winkelplein Nederland volgt je nu", body: "Je hebt een nieuwe volger.", need: null, read: true, time: ago(9 * H) },
  { type: "community", actor: "datalinqs", title: "Populair in AI", body: "De managed forecasting-service van DataLinqs krijgt vandaag veel aandacht.", need: "n8", read: true, time: ago(1 * D) },
  { type: "response", actor: "sneltransport", title: "SnelTransport NL reageerde", body: "op je interesse in capaciteit Tilburg→Eindhoven.", need: "n2", read: true, time: ago(1 * D + 2 * H) },
];

async function main() {
  console.log("→ Running schema…");
  const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");
  await sql.unsafe(schema);

  console.log("→ Clearing existing data…");
  await sql.unsafe(`TRUNCATE
    notifications, messages, conversation_participants, conversations,
    saves, follows, need_communities, needs, community_members, products,
    sessions, users, communities, companies RESTART IDENTITY CASCADE;`);

  console.log("→ Seeding communities…");
  for (const [id, name, kind, emoji, description, members, active] of communities) {
    await sql`INSERT INTO communities (id, name, kind, emoji, description, members, active_today)
      VALUES (${id}, ${name}, ${kind}, ${emoji}, ${description}, ${members}, ${active})`;
  }

  console.log("→ Seeding companies…");
  const coId = {};
  for (const c of companies) {
    const [row] = await sql`INSERT INTO companies
      (name, handle, logo_color, industry, city, country, description, website, phone, email, verified, rating, rating_count, followers, response_rate)
      VALUES (${c.name}, ${c.handle}, ${c.color}, ${c.industry}, ${c.city}, ${c.country}, ${c.desc},
              ${c.website ?? null}, ${c.phone ?? null}, ${c.email ?? null}, ${c.verified}, ${c.rating}, ${c.ratingCount}, ${c.followers}, ${c.responseRate})
      RETURNING id`;
    coId[c.key] = row.id;
    for (const cid of c.communities) {
      await sql`INSERT INTO community_members (company_id, community_id) VALUES (${row.id}, ${cid})`;
    }
    for (const [pn, pd] of c.products) {
      await sql`INSERT INTO products (company_id, name, description) VALUES (${row.id}, ${pn}, ${pd})`;
    }
  }

  console.log("→ Creating demo login (demo@vynta.app / vynta1234)…");
  const hash = await bcrypt.hash("vynta1234", 10);
  await sql`INSERT INTO users (company_id, email, password_hash, name, role)
    VALUES (${coId.meridian}, ${"demo@vynta.app"}, ${hash}, ${"Demo Gebruiker"}, ${"owner"})`;

  console.log("→ Seeding needs…");
  const needId = {};
  for (const n of needs) {
    const [row] = await sql`INSERT INTO needs
      (company_id, type, body, quantity, budget, has_image, status, responses, views, created_at, expires_at)
      VALUES (${coId[n.co]}, ${n.type}, ${n.body}, ${n.quantity ?? null}, ${n.budget ?? null},
              ${n.image ?? false}, ${n.status}, ${n.responses}, ${n.views}, ${n.created}, ${n.expires})
      RETURNING id`;
    needId[n.key] = row.id;
    for (const cid of n.communities) {
      await sql`INSERT INTO need_communities (need_id, community_id) VALUES (${row.id}, ${cid})`;
    }
  }

  console.log("→ Seeding follows (meridian follows volta + lumen)…");
  await sql`INSERT INTO follows (follower_company_id, followee_company_id) VALUES (${coId.meridian}, ${coId.volta})`;
  await sql`INSERT INTO follows (follower_company_id, followee_company_id) VALUES (${coId.meridian}, ${coId.lumen})`;

  console.log("→ Seeding conversations…");
  for (const cv of conversations) {
    const [conv] = await sql`INSERT INTO conversations (need_id) VALUES (${cv.need ? needId[cv.need] : null}) RETURNING id`;
    await sql`INSERT INTO conversation_participants (conversation_id, company_id, last_read_at)
      VALUES (${conv.id}, ${coId.meridian}, ${cv.unread ? ago(9 * H) : new Date()})`;
    await sql`INSERT INTO conversation_participants (conversation_id, company_id)
      VALUES (${conv.id}, ${coId[cv.with]})`;
    for (const m of cv.messages) {
      await sql`INSERT INTO messages (conversation_id, sender_company_id, kind, body, meta, created_at)
        VALUES (${conv.id}, ${coId[m.from]}, ${m.kind}, ${m.body}, ${m.meta ?? null}, ${m.time})`;
    }
  }

  console.log("→ Seeding notifications…");
  for (const n of notifications) {
    await sql`INSERT INTO notifications (company_id, type, title, body, actor_company_id, need_id, read, created_at)
      VALUES (${coId.meridian}, ${n.type}, ${n.title}, ${n.body}, ${n.actor ? coId[n.actor] : null}, ${n.need ? needId[n.need] : null}, ${n.read}, ${n.time})`;
  }

  console.log("✅ Database ready.");
  await sql.end();
}

main().catch(async (e) => {
  console.error("❌ Setup failed:", e);
  try { await sql.end(); } catch {}
  process.exit(1);
});
