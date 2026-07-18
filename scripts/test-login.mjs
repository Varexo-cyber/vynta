import postgres from "postgres";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function main() {
  // Find a user
  const users = await sql`
    SELECT u.id, u.email, u.company_id, c.name 
    FROM users u JOIN companies c ON c.id = u.company_id 
    LIMIT 5
  `;
  console.log("Users:", JSON.stringify(users, null, 2));

  if (users.length === 0) {
    console.log("No users found!");
    process.exit(1);
  }

  // Create a session for the first user
  const user = users[0];
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000);
  
  await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${user.id}, ${expires})`;
  
  console.log("\nSession token:", token);
  console.log("User:", user.email, "Company:", user.name, "Company ID:", user.company_id);
  
  await sql.end();
}

main().catch(console.error);
