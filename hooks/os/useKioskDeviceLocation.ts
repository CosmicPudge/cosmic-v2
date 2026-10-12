"use client";

import { useEffect } from "react";
import { hasMeaningfulDeviceLocationMove, isValidDeviceCoordinate, type DeviceLocationCandidate } from "@/services/kiosk/deviceLocation";
import { startKioskResource } from "@/services/kiosk/resourceLifecycle";

export const KIOSK_LOCATION_STORAGE_KEY = "cosmic:kiosk-device-location:v1";
const LOCATION_SOURCE_KEY = "cosmic:kiosk-device-location-source:v1";
const CHECK_INTERVAL_MS = 5 * 60_000;
const GPS_MAX_AGE_MS = 30 * 60_000;
const IP_MAX_AGE_MS = 30 * 60_000;

type DetectionSource = "browser" | "ip";

function readLocation(): DeviceLocationCandidate | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(KIOSK_LOCATION_STORAGE_KEY) ?? "null") as Partial<DeviceLocationCandidate> | null;
    if (typeof value?.latitude !== "number" || typeof value.longitude !== "number" ||
        !isValidDeviceCoordinate(value.latitude, value.longitude) || !value.resolvedAt ||
        !Number.isFinite(Date.parse(value.resolvedAt))) return null;
    return value as DeviceLocationCandidate;
  } catch { return null; }
}
function readSource(): DetectionSource | null {
  try {
    const source = window.localStorage.getItem(LOCATION_SOURCE_KEY);
    return source === "browser" || source === "ip" ? source : null;
  } catch { return null; }
}
function storeLocation(next: DeviceLocationCandidate, source: DetectionSource) {
  const prev = readLocation();
  const previousSource = readSource();
  if (prev && !hasMeaningfulDeviceLocationMove(prev, next) && previousSource === source &&
      Math.abs(prev.latitude - next.latitude) < 0.0005 &&
      Math.abs(prev.longitude - next.longitude) < 0.0005) {
    // Refresh the verification timestamp without causing a 30-second data refetch.
    try { window.localStorage.setItem(KIOSK_LOCATION_STORAGE_KEY, JSON.stringify(next)); } catch {}
    return;
  }
  try {
    window.localStorage.setItem(KIOSK_LOCATION_STORAGE_KEY, JSON.stringify(next));
    window.localStorage.setItem(LOCATION_SOURCE_KEY, source);
  } catch {}
  window.dispatchEvent(new CustomEvent("cosmic:kiosk-location-changed"));
  if (prev && hasMeaningfulDeviceLocationMove(prev, next))
    window.dispatchEvent(new CustomEvent("cosmic:kiosk-location-moved"));
}

export default function useKioskDeviceLocation() {
  useEffect(() => {
    const stopResource = startKioskResource("geolocation");
    let active = true;
    let checking = false;
    let lastBrowserSuccess = 0;
    let lastIpSuccess = 0;
    let primaryCooldownUntil = 0;

    const resolveIp = async () => {
      // Don't overwrite a recent browser fix with a less accurate IP estimate.
      if (Date.now() - lastBrowserSuccess < GPS_MAX_AGE_MS) return;
      const providers = [
        { url: "https://ipwho.is/", name: "primary" },
        { url: "https://ipapi.co/json/", name: "backup" },
      ] as const;
      for (const provider of providers) {
        if (provider.name === "primary" && Date.now() < primaryCooldownUntil) continue;
        try {
          const controller = new AbortController();
          const timer = window.setTimeout(() => controller.abort(), 7_000);
          let response: Response;
          try {
            response = await fetch(provider.url, { cache: "no-store", signal: controller.signal });
          } finally { window.clearTimeout(timer); }
          if (response.status === 429) {
            if (provider.name === "primary") primaryCooldownUntil = Date.now() + 60 * 60_000;
            continue;
          }
          if (!response.ok) continue;
          const result = await response.json() as {
            success?: boolean; latitude?: number; longitude?: number;
            city?: string; region?: string; country?: string; timezone?: string | { id?: string };
          };
          if (!active || result.success === false ||
            typeof result.latitude !== "number" || typeof result.longitude !== "number" ||
            !isValidDeviceCoordinate(result.latitude, result.longitude)) continue;
          const next: DeviceLocationCandidate = {
            latitude: result.latitude, longitude: result.longitude,
            resolvedAt: new Date().toISOString(), city: result.city, region: result.region,
            country: result.country,
            timezone: typeof result.timezone === "string" ? result.timezone : result.timezone?.id,
            label: [result.city, result.region].filter(Boolean).join(", "),
          };
          lastIpSuccess = Date.now();
          storeLocation(next, "ip");
          return;
        } catch { /* Try the next provider without discarding last-known coordinates. */ }
      }
    };

    const check = async () => {
      if (!active || checking) return;
      checking = true;
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition | null>(resolve => {
            navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
              enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000,
            });
          });
          if (!active) return;
          if (position && isValidDeviceCoordinate(position.coords.latitude, position.coords.longitude)) {
            lastBrowserSuccess = Date.now();
            storeLocation({
              latitude: position.coords.latitude, longitude: position.coords.longitude,
              ...(Number.isFinite(position.coords.accuracy) ? { accuracyMeters: position.coords.accuracy } : {}),
              resolvedAt: new Date().toISOString(),
            }, "browser");
            return;
          }
        }
        if (Date.now() - lastIpSuccess >= IP_MAX_AGE_MS) await resolveIp();
      } finally { checking = false; }
    };

    // A saved IP location is not a verified browser fix after a restart.
    // Check immediately, then repeatedly, including when connectivity returns.
    void check();
    const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    const onOnline = () => { lastIpSuccess = 0; void check(); };
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      stopResource();
    };
  }, []);
}

export function readKioskDeviceLocation() {
  if (typeof window === "undefined") return null;
  return readLocation();
}
