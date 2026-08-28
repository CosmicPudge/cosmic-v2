import "server-only";

import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool as PostgresPool } from "pg";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type CosmicDatabase = ReturnType<typeof createDatabase>;

function createDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for PostgreSQL mode.");
  if (process.env.NODE_ENV === "test" || process.env.COSMIC_TEST_MODE === "1") return drizzlePostgres(new PostgresPool({ connectionString: url }), { schema });
  return drizzleNeon(new NeonPool({ connectionString: url }), { schema });
}

let database: CosmicDatabase | undefined;

export function isDatabaseConfigured() { return Boolean(process.env.DATABASE_URL); }

export function getDatabase(): CosmicDatabase {
  return database ??= createDatabase();
}

export async function checkDatabase() {
  if (!isDatabaseConfigured()) return { configured: false, connected: false };
  try {
    await getDatabase().execute("select 1");
    return { configured: true, connected: true };
  } catch {
    return { configured: true, connected: false };
  }
}
