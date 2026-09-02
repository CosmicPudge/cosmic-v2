import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
if (process.env.SCHOOL_E2E_DRY_RUN === "true") { console.log("DRY RUN create synthetic School E2E account"); process.exit(0); }
const sql = neon(databaseUrl);
const id = `user_school_e2e_${randomUUID().replaceAll("-", "")}`;
const email = `school-e2e-${Date.now()}@example.invalid`;
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
const passwordHash = scryptSync(password, salt, 64).toString("hex");
await sql`insert into users (id, email, normalized_email, display_name, password_hash, password_salt) values (${id}, ${email}, ${email}, ${"Cosmic School E2E"}, ${passwordHash}, ${salt})`;
console.log(JSON.stringify({ id, email, password }));
