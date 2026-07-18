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

async function run() {
  const file = process.argv[2] ?? "migrations/001_networks.sql";
  const path = join(process.cwd(), file);
  const sqlContent = readFileSync(path, "utf8");
  await sql.unsafe(sqlContent);
  console.log(`Migration ${file} applied.`);
  await sql.end();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
