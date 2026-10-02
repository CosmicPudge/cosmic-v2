export type SigninStage =
  | "lookup-start"
  | "lookup-success"
  | "lookup-not-found"
  | "lookup-error"
  | "password-start"
  | "password-success"
  | "password-failed"
  | "access-start"
  | "access-success"
  | "access-failed"
  | "session-start"
  | "session-success"
  | "session-write-error"
  | "cookie-ready";

export type SigninCategory =
  | "account-not-found"
  | "invalid-password"
  | "account-access-error"
  | "connection-failed"
  | "ssl-error"
  | "table-missing"
  | "column-missing"
  | "migration-mismatch"
  | "query-error"
  | "permission-error"
  | "timeout"
  | "session-table-error"
  | "database-error"
  | "schema-error"
  | "session-write-error"
  | "unknown";

export type SigninStageLogger = (stage: SigninStage, category?: SigninCategory) => void;

type DatabaseFailureContext = "lookup" | "access" | "session";

export function classifySigninDatabaseError(error: unknown, context: DatabaseFailureContext = "lookup"): SigninCategory {
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code.toUpperCase() : "";
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL", "EAI_NONAME", "ECONNREFUSED"].includes(code)) return "connection-failed";
  if (["DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "CERT_HAS_EXPIRED", "ERR_TLS_CERT_ALTNAME_INVALID"].includes(code) || code.startsWith("ERR_SSL")) return "ssl-error";
  if (["ETIMEDOUT", "ESOCKETTIMEDOUT", "57014"].includes(code)) return "timeout";
  if (["42501", "28000", "28P01"].includes(code)) return "permission-error";
  if (code === "42P01") return context === "session" ? "session-table-error" : "table-missing";
  if (code === "42703") return context === "session" ? "session-table-error" : "column-missing";
  if (["42P02", "42883", "42P07"].includes(code)) return "query-error";
  if (/^[0-9A-Z]{5}$/.test(code)) return "query-error";
  if (code || error instanceof Error) return context === "session" ? "session-write-error" : "database-error";
  return "unknown";
}

export function createSigninStageLogger(enabled: boolean, sink: (line: string) => void = console.info): SigninStageLogger | undefined {
  if (!enabled) return undefined;
  return (stage, category) => sink(`[auth] signin.stage=${stage}${category ? ` category=${category}` : ""}`);
}

export function logSigninCategory(enabled: boolean, category: SigninCategory, sink: (line: string) => void = console.info) {
  if (enabled) sink(`[auth] signin.category=${category}`);
}
