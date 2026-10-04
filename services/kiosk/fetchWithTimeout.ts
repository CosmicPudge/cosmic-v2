export const KIOSK_PROVIDER_TIMEOUT_MS = 12_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = KIOSK_PROVIDER_TIMEOUT_MS,
  fetchImpl: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(input, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
