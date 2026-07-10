"use client";

import { useEffect } from "react";

import useLocation from "./useLocation";
import { useWeatherStore } from "@/stores/weatherStore";

export default function useWeather() {
  const location = useLocation();

  const weather = useWeatherStore((state) => state.weather);
  const loading = useWeatherStore((state) => state.loading);
  const error = useWeatherStore((state) => state.error);
  const lastUpdated = useWeatherStore((state) => state.lastUpdated);
  const refresh = useWeatherStore((state) => state.refresh);

  useEffect(() => {
    if (!location) return;

    refresh(location.lat, location.lon);

    const interval = setInterval(() => {
      refresh(location.lat, location.lon);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location]);

  return {
    weather,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}