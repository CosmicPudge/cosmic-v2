import "server-only";

import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool as PostgresPool } from "pg";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { classifyMetricError, recordDatabaseMetric } from "@/services/observability/metrics";
import { resolveDatabaseConfiguration } from "./runtime";

export type CosmicDatabase = ReturnType<typeof createDatabase>;

function createDatabase() {
  const { driver, url } = resolveDatabaseConfiguration();
  if (driver === "postgres" || process.env.NODE_ENV === "test" || process.env.COSMIC_TEST_MODE === "1") {
    return drizzlePostgres(instrumentPool(new PostgresPool({ connectionString: url })), { schema });
  }
  return drizzleNeon(instrumentPool(new NeonPool({ connectionString: url })), { schema });
}

function instrumentPool<T extends object>(pool: T): T {
  type QueryFunction = (...args: unknown[]) => unknown;
  const queryPool = pool as T & { query: QueryFunction };
  const originalQuery = queryPool.query.bind(pool);
  queryPool.query = (...args: unknown[]) => {
    const startedAt = performance.now();
    const result = originalQuery(...args);
    if (!result || typeof (result as Promise<unknown>).then !== "function") return result;
    return Promise.resolve(result).then((value: unknown) => {
      const rows = value && typeof value === "object" && "rows" in value && Array.isArray(value.rows) ? value.rows.length : undefined;
      recordDatabaseMetric({ operation: "query", durationMs: performance.now() - startedAt, rows });
      return value;
    }).catch((error: unknown) => {
      recordDatabaseMetric({ operation: "query", durationMs: performance.now() - startedAt, errorCategory: classifyMetricError(error) });
      throw error;
    });
  };
  return pool;
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
