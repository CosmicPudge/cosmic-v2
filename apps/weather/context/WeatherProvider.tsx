"use client";

import {
  createContext,
  useContext,
} from "react";

import useWeather from "@/hooks/os/useWeather";

type WeatherContextValue = ReturnType<typeof useWeather>;

const WeatherContext =
  createContext<WeatherContextValue | null>(null);

interface Props {
  children: React.ReactNode;
}

export function WeatherProvider({
  children,
}: Props) {
  const value = useWeather();

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeatherContext() {
  const context = useContext(WeatherContext);

  if (!context) {
    throw new Error(
      "useWeatherContext must be used inside WeatherProvider."
    );
  }

  return context;
}