export type DatabaseDriver = "neon" | "postgres";
export type DatabaseRuntimeDriver = "postgres" | "neon" | "missing" | "invalid";
export type DatabaseProvider = "supabase" | "neon" | "other" | "unknown";
export type DatabaseConnectionMode = "direct" | "session-pooler" | "transaction-pooler" | "unknown";
export type DatabaseFailureCategory = "dns" | "tls" | "authentication" | "connection_refused" | "timeout" | "postgres" | "configuration" | "unknown";

export type DatabaseRuntimeClassification = {
  driver: DatabaseRuntimeDriver;
  provider: DatabaseProvider;
  connectionMode: DatabaseConnectionMode;
  urlPresent: boolean;
};

export type DatabaseFailure = {
  category: DatabaseFailureCategory;
  code: string;
};

export function createPostgresPoolOptions(connectionString: string) {
  const { provider } = classifyDatabaseUrl(connectionString);
  return provider === "supabase"
    ? {
      connectionString,
      // Supabase's hosted PostgreSQL endpoints require TLS, while their
      // certificate chain is not available to the deployment runtime.
      ssl: { rejectUnauthorized: false },
    }
    : { connectionString };
}

type DatabaseEnvironment = {
  [key: string]: string | undefined;
  DATABASE_DRIVER?: string;
  DATABASE_URL?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
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

function classifyDatabaseUrl(value: string): Pick<DatabaseRuntimeClassification, "provider" | "connectionMode"> {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isSupabase = hostname.endsWith(".supabase.co") || hostname.endsWith(".pooler.supabase.com");
    if (isSupabase) {
      if (hostname.endsWith(".pooler.supabase.com")) {
        if (url.port === "6543") return { provider: "supabase", connectionMode: "transaction-pooler" };
        if (url.port === "5432" || url.port === "") return { provider: "supabase", connectionMode: "session-pooler" };
        return { provider: "supabase", connectionMode: "unknown" };
      }
      if (hostname.startsWith("db.") && url.port === "6543") return { provider: "supabase", connectionMode: "transaction-pooler" };
      return { provider: "supabase", connectionMode: hostname.startsWith("db.") ? "direct" : "unknown" };
    }
    if (hostname.endsWith(".neon.tech")) return { provider: "neon", connectionMode: "unknown" };
    return { provider: "other", connectionMode: "unknown" };
  } catch {
    return { provider: "unknown", connectionMode: "unknown" };
  }
}

export function classifyDatabaseRuntime(environment: DatabaseEnvironment = process.env): DatabaseRuntimeClassification {
  const rawDriver = environment.DATABASE_DRIVER?.trim();
  const driver: DatabaseRuntimeDriver = rawDriver === undefined || rawDriver === ""
    ? "missing"
    : rawDriver === "postgres" || rawDriver === "neon"
      ? rawDriver
      : "invalid";
  const url = environment.DATABASE_URL?.trim();
  const urlClassification = url ? classifyDatabaseUrl(url) : { provider: "unknown" as const, connectionMode: "unknown" as const };
  return { driver, ...urlClassification, urlPresent: Boolean(url) };
}

export function canRunDatabaseDiagnostic(environment: DatabaseEnvironment = process.env): boolean {
  return environment.VERCEL_ENV !== undefined
    ? environment.VERCEL_ENV !== "production"
    : environment.NODE_ENV !== "production";
}

export function classifyDatabaseFailure(error: unknown): DatabaseFailure {
  const rawCode = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code.toUpperCase() : "";
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL", "EAI_NONAME"].includes(rawCode)) return { category: "dns", code: "DNS_RESOLUTION_FAILED" };
  if (["DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "CERT_HAS_EXPIRED", "ERR_TLS_CERT_ALTNAME_INVALID"].includes(rawCode) || rawCode.startsWith("ERR_SSL")) return { category: "tls", code: "TLS_NEGOTIATION_FAILED" };
  if (rawCode === "ECONNREFUSED") return { category: "connection_refused", code: "CONNECTION_REFUSED" };
  if (["ETIMEDOUT", "ESOCKETTIMEDOUT"].includes(rawCode)) return { category: "timeout", code: "CONNECTION_TIMEOUT" };
  if (/^28[A-Z0-9]{3}$/.test(rawCode)) return { category: "authentication", code: "POSTGRES_AUTHENTICATION_FAILED" };
  if (["EINVAL", "ERR_INVALID_URL"].includes(rawCode)) return { category: "configuration", code: "DATABASE_CONFIGURATION_INVALID" };
  if (/^[0-9A-Z]{5}$/.test(rawCode)) return { category: "postgres", code: "POSTGRES_CONNECTION_FAILED" };
  return { category: "unknown", code: "DATABASE_CONNECTION_FAILED" };
}

export async function checkDatabaseStatus(input: {
  configured: boolean;
  check: () => Promise<unknown>;
}): Promise<{ configured: boolean; connected: boolean; failure?: DatabaseFailure }> {
  if (!input.configured) return { configured: false, connected: false };
  try {
    await input.check();
    return { configured: true, connected: true };
  } catch (error) {
    return { configured: true, connected: false, failure: classifyDatabaseFailure(error) };
  }
}
