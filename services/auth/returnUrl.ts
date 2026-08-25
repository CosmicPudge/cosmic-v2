const FALLBACK_RETURN_URL = "/os";

export function safeReturnUrl(value: unknown, fallback = FALLBACK_RETURN_URL) {
  if (typeof value !== "string" || value.length === 0 || value.length > 512 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const url = new URL(value, "https://cosmic.invalid");
    if (url.origin !== "https://cosmic.invalid" || url.pathname.startsWith("/api") || url.pathname.startsWith("/_next")) return fallback;
    return `${url.pathname}${url.search}`;
  } catch { return fallback; }
}

export function authReturnUrl(value: unknown) { return safeReturnUrl(value, FALLBACK_RETURN_URL); }
