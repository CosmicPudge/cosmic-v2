export type PhoneBackendStatus =
  | "unknown"
  | "connected"
  | "unauthenticated"
  | "unavailable";

function isAuthFailure(result: PromiseSettledResult<unknown>) {
  return result.status === "rejected" && /\b(401|403)\b/.test(
    result.reason instanceof Error ? result.reason.message : String(result.reason),
  );
}

export function classifyBackendResults(
  results: readonly PromiseSettledResult<unknown>[],
): PhoneBackendStatus {
  if (results.some((result) => result.status === "fulfilled")) return "connected";
  if (results.length > 0 && results.every(isAuthFailure)) return "unauthenticated";
  return results.length > 0 ? "unavailable" : "unknown";
}

export function shouldResumePhoneRefresh(
  visibility: DocumentVisibilityState,
  refreshInFlight: boolean,
) {
  return visibility === "visible" && !refreshInFlight;
}
