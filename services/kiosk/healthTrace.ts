import type { KioskHealthService } from "./connectionHealth";

export function kioskDiagnosticsEnabled() {
  if (process.env.NODE_ENV !== "production") return true;
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  return hostname === "dev.cosmicpudge.shop" || hostname === "localhost" || hostname === "127.0.0.1";
}

export function traceKioskHealth(service: KioskHealthService, stage: string, fields: Record<string, string | number | boolean | undefined> = {}) {
  if (!kioskDiagnosticsEnabled()) return;
  const suffix = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");
  console.info(`[kiosk-health-trace] stage=${stage} service=${service}${suffix ? ` ${suffix}` : ""}`);
}
