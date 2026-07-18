import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  } catch {}
}
loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });

async function main() {
  const cols = await sql`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position`;

  const byTable: Record<string, string[]> = {};
  for (const c of cols) {
    const t = c.table_name as string;
    (byTable[t] ??= []).push(`${c.column_name} (${c.data_type})`);
  }
  for (const [t, list] of Object.entries(byTable)) {
    console.log(`\n== ${t} ==`);
    for (const l of list) console.log("  " + l);
  }

  const counts: Record<string, number> = {};
  for (const t of Object.keys(byTable)) {
    try {
      const [{ n }] = await sql`SELECT count(*)::int AS n FROM ${sql(t)}`;
      counts[t] = n as number;
    } catch {
      counts[t] = -1;
    }
  }
  console.log("\n== row counts ==");
  console.log(counts);

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
