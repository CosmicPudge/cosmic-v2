"use client";

import { useEffect, useRef, useState } from "react";

import { WeatherEngine } from "@/engines/weather";
import useLocation from "@/hooks/os/useLocation";

import type { WeatherData } from "@/engines/environment";

export default function useWeather() {
  const location = useLocation();
  const weatherEngine = useRef<WeatherEngine | null>(null);

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

 useEffect(() => {
  if (!location) { const timer = window.setTimeout(() => { setLoading(false); setWeather(null); }, 0); return () => window.clearTimeout(timer); }

  const { lat, lon } = location;

  async function load() {
    try {
      weatherEngine.current ??= new WeatherEngine();
      if (!weatherEngine.current.isReady()) {
        await weatherEngine.current.initialize({
          lat,
          lon,
        });
      } else {
        await weatherEngine.current.refresh();
      }

      setWeather(
        await weatherEngine.current.getSnapshot()
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
