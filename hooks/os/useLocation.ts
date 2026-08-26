"use client";

import { useEffect, useState } from "react";
import { useCosmicScope, createScopedStorageKey } from "@/services/storage/scope";
import { kioskApiUrl } from "@/services/kioskRequest";
import { TEMPORARY_KIOSK_LOCATION } from "@/services/kioskLocation";

export interface UserLocation {
  lat: number;
  lon: number;
}

const DEVELOPMENT_LOCATION: UserLocation = {
  lat: 40.9177,
  lon: -111.3994,
};

type KioskProfileResponse = { profile?: { effectiveLocation?: KioskProfileLocation | null } | null };
type KioskProfileLocation = { latitude?: number; longitude?: number };

function weatherLog(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[weather] ${message}`);
}

function resolveFallback(scopeId: string) {
  const saved = readSavedLocation(scopeId);
  if (saved) {
    weatherLog("location-state=available");
    return saved;
  }
  if (scopeId === "local") {
    weatherLog("location-state=available");
    return DEVELOPMENT_LOCATION;
  }
  weatherLog("location-state=missing");
  return null;
}

export default function useLocation() {
  const scope = useCosmicScope();
  const [location, setLocation] =
    useState<UserLocation | null>(null);

  useEffect(() => {
    const kiosk = typeof window !== "undefined" && window.location.pathname === "/os/kiosk";
    if (kiosk) {
      let active = true;
      const resolveKioskLocation = async () => {
        let profileLocation: UserLocation | null = null;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(kioskApiUrl("/api/devices/kiosk-profile"), { credentials: "include", cache: "no-store", signal: controller.signal });
          if (response.ok) {
            const body = await response.json() as KioskProfileResponse;
            profileLocation = toUserLocation(body.profile?.effectiveLocation);
          }
        } catch {
          // The temporary fallback keeps kiosk weather usable when the profile cannot be read.
        } finally {
          window.clearTimeout(timeout);
        }
        if (!active) return;
        const saved = readSavedLocation(scope.id);
        const resolved = profileLocation ?? saved ?? { lat: TEMPORARY_KIOSK_LOCATION.latitude, lon: TEMPORARY_KIOSK_LOCATION.longitude };
        weatherLog("location-state=available");
        setLocation(resolved);
      };
      void resolveKioskLocation();
      const refresh = window.setInterval(() => void resolveKioskLocation(), 45_000);
      return () => { active = false; window.clearInterval(refresh); };
    }

    if (!navigator.geolocation) {
      const fallback = resolveFallback(scope.id);
      window.setTimeout(() => setLocation(fallback), 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        weatherLog("location-state=available");
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        weatherLog(`location-state=${error.code === error.PERMISSION_DENIED ? "denied" : "error"}`);
        window.setTimeout(() => setLocation(resolveFallback(scope.id)), 0);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [scope.id]);

  return location;
}

function toUserLocation(value?: KioskProfileLocation | null): UserLocation | null {
  return typeof value?.latitude === "number" && Number.isFinite(value.latitude) && typeof value.longitude === "number" && Number.isFinite(value.longitude)
    ? { lat: value.latitude, lon: value.longitude }
    : null;
}

function readSavedLocation(scopeId: string): UserLocation | null {
  try { const raw = window.localStorage.getItem(createScopedStorageKey("weather-location", scopeId)); const value = raw ? JSON.parse(raw) as Partial<UserLocation> : null; return value && typeof value.lat === "number" && typeof value.lon === "number" ? { lat: value.lat, lon: value.lon } : null; } catch { return null; }
}
