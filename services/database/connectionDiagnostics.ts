export type ConnectionFailureCategory =
  | "authentication-failed"
  | "tls-error"
  | "dns-error"
  | "connection-refused"
  | "timeout"
  | "unsupported-option"
  | "parse-error"
  | "runtime-incompatible"
  | "unknown";

const SAFE_CODE = /^[A-Z0-9_:-]{2,80}$/;

function errorRecord(error: unknown): Record<string, unknown> | null {
  return error && typeof error === "object" ? error as Record<string, unknown> : null;
}

export function safeDatabaseErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 3; depth += 1) {
    const record = errorRecord(current);
    const code = record?.code;
    if (typeof code === "string" && SAFE_CODE.test(code.toUpperCase())) return code.toUpperCase();
    current = record?.cause;
  }
  return null;
}

export function classifyConnectionFailure(error: unknown): ConnectionFailureCategory {
  const code = safeDatabaseErrorCode(error);
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (["28P01", "28000", "28P02"].includes(code ?? "")) return "authentication-failed";
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL", "EAI_NONAME"].includes(code ?? "")) return "dns-error";
  if (code === "ECONNREFUSED") return "connection-refused";
  if (["ETIMEDOUT", "ESOCKETTIMEDOUT", "57014"].includes(code ?? "")) return "timeout";
  if (code === "ERR_INVALID_URL" || /invalid (connection )?string|invalid url|parse error/.test(message)) return "parse-error";
  if (code?.startsWith("ERR_SSL") || ["SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "CERT_HAS_EXPIRED", "ERR_TLS_CERT_ALTNAME_INVALID"].includes(code ?? "") || /tls|ssl|certificate/.test(message)) return "tls-error";
  if (/unsupported|not supported|invalid sslnegotiation|unknown option/.test(message)) return "unsupported-option";
  if (/edge runtime|node:|module not found|not available in this runtime/.test(message)) return "runtime-incompatible";
  return "unknown";
}

export function safeDatabaseClientName(driver: string | undefined): string {
  return driver === "postgres" ? "pg via drizzle-orm/node-postgres" : driver === "neon" ? "@neondatabase/serverless via drizzle-orm/neon-serverless" : "unknown";
}
