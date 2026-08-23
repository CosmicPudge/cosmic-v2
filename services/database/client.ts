import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type CosmicDatabase = ReturnType<typeof createDatabase>;

function createDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for PostgreSQL mode.");
  return drizzle(neon(url), { schema });
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
