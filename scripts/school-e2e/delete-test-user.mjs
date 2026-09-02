import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";

const id = process.env.SCHOOL_E2E_USER_ID;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !id || !id.startsWith("user_school_e2e_")) throw new Error("Require DATABASE_URL and a synthetic SCHOOL_E2E_USER_ID.");
if (process.env.SCHOOL_E2E_DRY_RUN === "true") { console.log(`DRY RUN delete synthetic account ${id}`); process.exit(0); }
if (process.env.SCHOOL_E2E_ALLOW_PRODUCTION !== "true" && process.env.SCHOOL_E2E_BASE_URL && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(process.env.SCHOOL_E2E_BASE_URL)) throw new Error("Refusing non-local cleanup without SCHOOL_E2E_ALLOW_PRODUCTION=true.");
const sql = neon(databaseUrl);
const assets = await sql`select storage_provider, storage_key from school_assets where user_id = ${id}`;
for (const asset of assets) if (asset.storage_provider === "vercel-blob" && process.env.BLOB_READ_WRITE_TOKEN) await del(asset.storage_key);
await sql`delete from users where id = ${id}`;
console.log(JSON.stringify({ deleted: true, id }));
