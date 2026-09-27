const SAFE_MESSAGES = new Set([
  "Enter a valid email address.",
  "Password must be at least 10 characters.",
  "Email or password is incorrect.",
  "This password reset link is invalid or expired.",
  "Reset token and a new password are required.",
]);

type DatabaseError = {
  code?: unknown;
  constraint?: unknown;
  table?: unknown;
  column?: unknown;
};

function databaseErrorDetails(error: unknown): DatabaseError {
  if (!error || typeof error !== "object") return {};
  const record = error as Record<string, unknown>;
  return {
    ...(typeof record.code === "string" ? { code: record.code } : {}),
    ...(typeof record.constraint === "string" ? { constraint: record.constraint } : {}),
    ...(typeof record.table === "string" ? { table: record.table } : {}),
    ...(typeof record.column === "string" ? { column: record.column } : {}),
  };
}

function safeErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  if (SAFE_MESSAGES.has(message) || message === "Account access has been disabled." || message.startsWith("Account temporarily suspended")) return message;

  const details = databaseErrorDetails(error);
  if (details.code === "23505" && details.constraint === "users_normalized_email_unique") {
    return "An account with that email already exists.";
  }
  return fallback;
}

export function authErrorResponse(error: unknown, fallback: string, status: number): Response {
  const details = databaseErrorDetails(error);
  if (details.code || details.constraint || details.table || details.column) {
    console.error("[auth] request failed", details);
  }
  return Response.json({ error: safeErrorMessage(error, fallback) }, { status });
}
