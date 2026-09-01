export function safeDatabaseFailure(error: unknown) {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const token = (candidate: unknown) => typeof candidate === "string" && /^[a-zA-Z0-9_.-]{1,120}$/.test(candidate) ? candidate : undefined;
  return { dbCode: token(value.code) ?? "unknown", constraint: token(value.constraint), column: token(value.column) };
}
