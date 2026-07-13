"use client";

import { useEffect, useState } from "react";

import { cosmic } from "@/core/CosmicCore";
import useLocation from "@/hooks/os/useLocation";

import type { WeatherData } from "@/engines/environment";

export default function useWeather() {
  const location = useLocation();

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

 useEffect(() => {
  if (!location) return;

  const { lat, lon } = location;

  async function load() {
    try {
      if (!cosmic.weather.isReady()) {
        await cosmic.weather.initialize({
          lat,
          lon,
        });
      } else {
        await cosmic.weather.refresh();
      }

      setWeather(
        await cosmic.weather.getSnapshot()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unknown weather error"
      );
    } finally {
      setLoading(false);
    }
  }

  load();
}, [location]);

  return {
    weather,
    loading,
    error,
  };
}