import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
const accountId = process.env.COSMIC_ADMIN_ACCOUNT_ID;
if (!databaseUrl || !accountId) throw new Error("Set DATABASE_URL and COSMIC_ADMIN_ACCOUNT_ID.");
const sql = neon(databaseUrl);
const rows = await sql`select id, email from users where id = ${accountId} limit 1`;
if (!rows[0]) throw new Error("No account exists with COSMIC_ADMIN_ACCOUNT_ID.");
await sql`insert into account_roles (account_id, role, created_by) values (${accountId}, 'admin', ${accountId}) on conflict (account_id, role) do nothing`;
console.log(`Admin role ensured for ${rows[0].email} (${rows[0].id}).`);
