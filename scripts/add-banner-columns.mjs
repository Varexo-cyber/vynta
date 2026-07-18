import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local manually
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
  // Add banner_url column
  try {
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS banner_url TEXT`;
    console.log("✓ banner_url column added");
  } catch (e) {
    console.log("banner_url:", e.message);
  }

  // Add banner_crop_data column (JSON for crop positioning)
  try {
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS banner_crop_data JSONB`;
    console.log("✓ banner_crop_data column added");
  } catch (e) {
    console.log("banner_crop_data:", e.message);
  }

  // Add logo_crop_data column (JSON for crop positioning)
  try {
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_crop_data JSONB`;
    console.log("✓ logo_crop_data column added");
  } catch (e) {
    console.log("logo_crop_data:", e.message);
  }

  await sql.end();
  console.log("Done");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
