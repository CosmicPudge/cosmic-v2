export type DatabaseDriver = "neon" | "postgres";

type DatabaseEnvironment = {
  [key: string]: string | undefined;
  DATABASE_DRIVER?: string;
  DATABASE_URL?: string;
};

export function resolveDatabaseDriver(value = process.env.DATABASE_DRIVER): DatabaseDriver {
  if (value === undefined || value.trim() === "") return "neon";
  if (value === "neon" || value === "postgres") return value;
  throw new Error("DATABASE_DRIVER must be either 'neon' or 'postgres'.");
}

export function resolveDatabaseConfiguration(environment: DatabaseEnvironment = process.env) {
  const url = environment.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required for PostgreSQL mode.");
  return { driver: resolveDatabaseDriver(environment.DATABASE_DRIVER), url };
}
