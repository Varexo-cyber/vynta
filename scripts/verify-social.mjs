import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);
const r = await sql`SELECT * FROM post_reactions LIMIT 1`;
const c = await sql`SELECT * FROM post_comments LIMIT 1`;
console.log("post_reactions OK", r.length);
console.log("post_comments OK", c.length);
process.exit(0);
