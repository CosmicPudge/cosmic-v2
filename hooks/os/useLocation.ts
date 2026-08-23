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

export default function useLocation() {
  const scope = useCosmicScope();
  const [location, setLocation] =
    useState<UserLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      const saved = readSavedLocation(scope.id);
      window.setTimeout(() => setLocation(saved ?? (scope.id === "local" ? DEVELOPMENT_LOCATION : null)), 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation failed:", error.message);
        window.setTimeout(() => setLocation(readSavedLocation(scope.id) ?? (scope.id === "local" ? DEVELOPMENT_LOCATION : null)), 0);
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
