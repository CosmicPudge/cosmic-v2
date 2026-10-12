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

    const resolveIp = async () => {
      // Browser geolocation is more precise. Never replace a recent browser fix
      // with city-level IP coordinates just because a later browser request fails.
      if (Date.now() - lastBrowserSuccess < GPS_MAX_AGE_MS) return;
      try {
        const response = await fetch("https://ipwho.is/", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as {
          success?: boolean; latitude?: number; longitude?: number;
          city?: string; region?: string; country?: string; timezone?: { id?: string };
        };
        if (!active || result.success === false ||
            typeof result.latitude !== "number" || typeof result.longitude !== "number" ||
            !isValidDeviceCoordinate(result.latitude, result.longitude)) return;
        const next: DeviceLocationCandidate = {
          latitude: result.latitude, longitude: result.longitude,
          resolvedAt: new Date().toISOString(), city: result.city, region: result.region,
          country: result.country, timezone: result.timezone?.id,
          label: [result.city, result.region].filter(Boolean).join(", "),
        };
        lastIpSuccess = Date.now();
        storeLocation(next, "ip");
      } catch { /* Keep last-known location until a valid check succeeds. */ }
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
