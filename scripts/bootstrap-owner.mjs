import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import postgres from "postgres";

function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const rawValue = match[2].trim();
        const value =
          (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
          (rawValue.startsWith("'") && rawValue.endsWith("'"))
            ? rawValue.slice(1, -1)
            : rawValue;
        process.env[match[1]] ??= value;
      }
    }
  } catch {}
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;

if (!databaseUrl || !email || !password) {
  throw new Error("DATABASE_URL, OWNER_EMAIL en OWNER_PASSWORD zijn verplicht.");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("OWNER_EMAIL is geen geldig e-mailadres.");
}
if (password.length < 12) {
  throw new Error("OWNER_PASSWORD moet minimaal 12 tekens bevatten.");
}

const sql = postgres(databaseUrl, { ssl: "require", prepare: false });

try {
  const hash = await bcrypt.hash(password, 12);
  await sql.begin(async (tx) => {
    let users = await tx`SELECT id, company_id FROM users WHERE email = ${email} LIMIT 1`;
    if (users.length === 0) {
      const [company] = await tx`
        INSERT INTO companies (name, handle, logo_color, industry, city, province, country, description, email, verified)
        VALUES ('Varexo', 'varexo', '#111111', 'Software & IT', 'Nederland', '', 'Nederland', 'Platformbeheer van Vynta.', ${email}, true)
        ON CONFLICT (handle) DO UPDATE SET email = EXCLUDED.email, verified = true
        RETURNING id
      `;
      users = await tx`
        INSERT INTO users (company_id, email, password_hash, name, role, platform_role, account_status)
        VALUES (${company.id}, ${email}, ${hash}, 'Varexo Owner', 'owner', 'owner', 'active')
        RETURNING id, company_id
      `;
    } else {
      await tx`
        UPDATE users
        SET password_hash = ${hash}, platform_role = 'owner', account_status = 'active',
            suspended_at = NULL, suspension_reason = NULL
        WHERE id = ${users[0].id}
      `;
      await tx`UPDATE companies SET verified = true WHERE id = ${users[0].company_id}`;
    }

    await tx`
      INSERT INTO admin_audit_log (actor_user_id, action, target_type, target_id, metadata)
      VALUES (${users[0].id}, 'owner_bootstrapped', 'user', ${users[0].id}, ${JSON.stringify({ source: "bootstrap" })}::jsonb)
    `;
  });

  const [owner] = await sql`
    SELECT u.platform_role, u.account_status, u.password_hash, c.verified
    FROM users u
    LEFT JOIN companies c ON c.id = u.company_id
    WHERE u.email = ${email}
    LIMIT 1
  `;
  const passwordValid = owner
    ? await bcrypt.compare(password, owner.password_hash)
    : false;
  if (
    !owner ||
    owner.platform_role !== "owner" ||
    owner.account_status !== "active" ||
    owner.verified !== true ||
    !passwordValid
  ) {
    throw new Error("Owneraccount kon niet veilig worden geverifieerd.");
  }
  console.log("Owneraccount is actief.");
} finally {
  await sql.end();
}
