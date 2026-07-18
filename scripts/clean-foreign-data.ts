import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

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

async function clean() {
  const before = await sql`SELECT count(*)::int AS n FROM companies`;
  console.log(`→ ${before[0].n} bedrijven in de database`);

  await sql`
    DELETE FROM companies
    WHERE LOWER(TRIM(country)) NOT IN ('nederland', 'netherlands', 'nl')
  `;

  const after = await sql`SELECT count(*)::int AS n FROM companies`;
  console.log(`→ ${before[0].n - after[0].n} buitenlandse bedrijven verwijderd`);

  // Verwijder lege gesprekken die ontstaan doordat deelnemers via cascade zijn verwijderd
  await sql`
    DELETE FROM conversations c
    WHERE NOT EXISTS (
      SELECT 1 FROM conversation_participants p WHERE p.conversation_id = c.id
    )
  `;

  console.log("→ Opruimen voltooid");
  await sql.end();
}

clean().catch((err) => {
  console.error("❌ Opruimen mislukt:", err);
  process.exit(1);
});
