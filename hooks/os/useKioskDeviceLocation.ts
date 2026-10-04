"use client";

import { useEffect } from "react";
import { hasMeaningfulDeviceLocationMove, type DeviceLocationCandidate } from "@/services/kiosk/deviceLocation";
import { startKioskResource } from "@/services/kiosk/resourceLifecycle";

export const KIOSK_LOCATION_STORAGE_KEY = "cosmic:kiosk-device-location:v1";

function readLocation(): DeviceLocationCandidate | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(KIOSK_LOCATION_STORAGE_KEY) ?? "null") as Partial<DeviceLocationCandidate> | null;
    return typeof value?.latitude === "number" && typeof value.longitude === "number" && typeof value.resolvedAt === "string" ? value as DeviceLocationCandidate : null;
  } catch { return null; }
}

function writeLocation(value: DeviceLocationCandidate) {
  try { window.localStorage.setItem(KIOSK_LOCATION_STORAGE_KEY, JSON.stringify(value)); } catch { /* Local persistence is optional. */ }
  window.dispatchEvent(new CustomEvent("cosmic:kiosk-location-changed"));
}

export default function useKioskDeviceLocation() {
  useEffect(() => {
    if (!navigator.geolocation) return;
    const stopResource = startKioskResource("geolocation");
    let active = true;
    let retryTimer: number | undefined;
    let lastAttempt = 0;
    const resolve = () => {
      if (!active || Date.now() - lastAttempt < 30_000) return;
      lastAttempt = Date.now();
      navigator.geolocation.getCurrentPosition((position) => {
        if (!active) return;
        const next: DeviceLocationCandidate = { latitude: position.coords.latitude, longitude: position.coords.longitude, ...(Number.isFinite(position.coords.accuracy) ? { accuracyMeters: position.coords.accuracy } : {}), resolvedAt: new Date().toISOString() };
        const previous = readLocation();
        writeLocation(next);
        if (previous && hasMeaningfulDeviceLocationMove(previous, next)) window.dispatchEvent(new CustomEvent("cosmic:kiosk-location-moved"));
      }, () => {
        if (active) retryTimer = window.setTimeout(resolve, 5 * 60_000);
      }, { enableHighAccuracy: false, timeout: 8_000, maximumAge: 10 * 60_000 });
    };
    const onOnline = () => resolve();
    const onVisibility = () => { if (document.visibilityState === "visible") resolve(); };
    resolve();
    const interval = window.setInterval(resolve, 30 * 60_000);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { active = false; window.clearInterval(interval); if (retryTimer) window.clearTimeout(retryTimer); window.removeEventListener("online", onOnline); document.removeEventListener("visibilitychange", onVisibility); stopResource(); };
  }, []);
}

export function readKioskDeviceLocation() {
  if (typeof window === "undefined") return null;
  return readLocation();
}
