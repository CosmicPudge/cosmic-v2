"use client";

import { create } from "zustand";

import type { WeatherData } from "@/engines/environment";
import { getWeather } from "@/services/weatherService";

interface WeatherState {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;

  refresh: (lat: number, lon: number) => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: null,
  loading: false,
  error: null,
  lastUpdated: null,

  refresh: async (lat, lon) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const weather = await getWeather(lat, lon);

      set({
        weather,
        loading: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown weather error",
      });
    }
  },
}));