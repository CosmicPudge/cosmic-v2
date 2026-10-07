export type WeatherDiagnosticResult = "ok" | "unauthorized" | "rate-limited" | "timeout" | "network-error" | "invalid-response" | "configuration-error" | "unknown";
export type SchoolDiagnosticResult = "ok" | "auth-error" | "timeout" | "network-error" | "invalid-response" | "no-source" | "account-not-found" | "credential-error" | "provider-error" | "unknown";

export type KioskDiagnostics = {
  weather: {
    apiKeyConfigured: boolean;
    browserLocationProvided: boolean;
    storedLocationAvailable: boolean;
    serverFallbackConfigured: boolean;
    locationSource: "browser" | "stored" | "server-fallback" | "unavailable";
    providerAttempted: boolean;
    providerResult: WeatherDiagnosticResult;
    httpStatus?: number;
    aggregateHasWeather: boolean;
  };
  school: {
    accountConfigured: boolean;
    accountLookupAttempted: boolean;
    accountMatched: boolean;
    provider: "canvas" | "ical" | "none";
    providerConfigured: boolean;
    credentialAvailable: boolean;
    providerAttempted: boolean;
    providerResult: SchoolDiagnosticResult;
    fallbackConfigured: boolean;
    aggregateConfigured: boolean;
    aggregateHasData: boolean;
  };
};

export function createKioskDiagnostics(): KioskDiagnostics {
  return {
    weather: { apiKeyConfigured: Boolean(process.env.OPENWEATHER_API_KEY), browserLocationProvided: false, storedLocationAvailable: false, serverFallbackConfigured: false, locationSource: "unavailable", providerAttempted: false, providerResult: "unknown", aggregateHasWeather: false },
    school: { accountConfigured: Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim()), accountLookupAttempted: false, accountMatched: false, provider: "none", providerConfigured: false, credentialAvailable: false, providerAttempted: false, providerResult: "unknown", fallbackConfigured: Boolean(process.env.COSMIC_KIOSK_CANVAS_ICAL_URL?.trim()), aggregateConfigured: false, aggregateHasData: false },
  };
}

export function classifyWeatherError(error: unknown): { result: WeatherDiagnosticResult; httpStatus?: number } {
  const candidate = error as { category?: unknown; status?: unknown; code?: unknown; name?: unknown; message?: unknown } | null;
  const status = typeof candidate?.status === "number" ? candidate.status : undefined;
  if (status === 401 || status === 403) return { result: "unauthorized", httpStatus: status };
  if (status === 429) return { result: "rate-limited", httpStatus: status };
  if (candidate?.category === "configuration-error") return { result: "configuration-error" };
  if (candidate?.category === "invalid-response") return { result: "invalid-response", ...(status ? { httpStatus: status } : {}) };
  if (candidate?.category === "timeout" || candidate?.name === "AbortError" || candidate?.code === "ETIMEDOUT") return { result: "timeout" };
  if (candidate?.category === "network-error" || typeof candidate?.code === "string") return { result: "network-error" };
  if (typeof candidate?.message === "string" && /timeout|timed out/i.test(candidate.message)) return { result: "timeout" };
  return { result: "unknown" };
}

export function diagnosticsEnvironment(request: Request) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const configuredHost = (process.env.COSMIC_KIOSK_HOSTNAME ?? "dev.cosmicpudge.shop").toLowerCase().split(":")[0];
  const allowedHost = hostname === configuredHost || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(hostname));
  return { allowedHost, enabled: process.env.COSMIC_DEV_KIOSK_ENABLED === "true" || process.env.COSMIC_KIOSK_ENABLED === "true", environment: process.env.NODE_ENV === "production" ? "production" : "dev" as const };
}
