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
  | "database-error"
  | "schema-error"
  | "session-write-error"
  | "unknown";

export type SigninStageLogger = (stage: SigninStage, category?: SigninCategory) => void;

const SCHEMA_ERROR_CODES = new Set(["42P01", "42703", "42883", "42P07"]);

export function classifySigninDatabaseError(error: unknown, fallback: "database-error" | "session-write-error" = "database-error"): SigninCategory {
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code.toUpperCase() : "";
  if (SCHEMA_ERROR_CODES.has(code)) return "schema-error";
  if (code || error instanceof Error) return fallback;
  return "unknown";
}

export function createSigninStageLogger(enabled: boolean, sink: (line: string) => void = console.info): SigninStageLogger | undefined {
  if (!enabled) return undefined;
  return (stage, category) => sink(`[auth] signin.stage=${stage}${category ? ` category=${category}` : ""}`);
}

export function logSigninCategory(enabled: boolean, category: SigninCategory, sink: (line: string) => void = console.info) {
  if (enabled) sink(`[auth] signin.category=${category}`);
}
