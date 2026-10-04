import type { KioskHealthService } from "./connectionHealth";

export function traceKioskHealth(service: KioskHealthService, stage: string, fields: Record<string, string | number | boolean | undefined> = {}) {
  if (process.env.NODE_ENV === "production") return;
  const suffix = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");
  console.info(`[kiosk-health-trace] stage=${stage} service=${service}${suffix ? ` ${suffix}` : ""}`);
}
