"use client";

import { useEffect, useRef, useState } from "react";

import { WeatherEngine } from "@/engines/weather";
import useLocation from "@/hooks/os/useLocation";

import type { WeatherData } from "@/engines/environment";

function weatherLog(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[weather] ${message}`);
}

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
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  let active = true;

  async function load() {
    try {
      weatherEngine.current ??= new WeatherEngine();
      await weatherEngine.current.initialize({ lat, lon }, controller.signal);

      const snapshot = await weatherEngine.current.getSnapshot();
      if (!active) return;
      setWeather(snapshot);
      weatherLog("fetch-success");
    } catch (err) {
      if (!active || controller.signal.aborted) return;
      setError(
        err instanceof Error
          ? err.message
          : "Unknown weather error"
      );
      weatherLog("fetch-error");
    } finally {
      window.clearTimeout(timeout);
      if (active) setLoading(false);
    }
  }

  const start = window.setTimeout(() => {
    if (!active) return;
    setLoading(true);
    setError(null);
    weatherLog("fetch-start");
    void load();
  }, 0);
  return () => { active = false; window.clearTimeout(start); window.clearTimeout(timeout); controller.abort(); };
}, [location]);

  return {
    weather,
    loading,
    error,
  };
}
