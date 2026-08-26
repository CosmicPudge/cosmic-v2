"use client";

import { useEffect, useState } from "react";
import { useCosmicScope, createScopedStorageKey } from "@/services/storage/scope";

export interface UserLocation {
  lat: number;
  lon: number;
}

const DEVELOPMENT_LOCATION: UserLocation = {
  lat: 40.9177,
  lon: -111.3994,
};

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

function readSavedLocation(scopeId: string): UserLocation | null {
  try { const raw = window.localStorage.getItem(createScopedStorageKey("weather-location", scopeId)); const value = raw ? JSON.parse(raw) as Partial<UserLocation> : null; return value && typeof value.lat === "number" && typeof value.lon === "number" ? { lat: value.lat, lon: value.lon } : null; } catch { return null; }
}
