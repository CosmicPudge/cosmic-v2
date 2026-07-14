"use client";

import useWeather from "@/hooks/os/useWeather";

export default function AmbientWeather() {
  const { weather, loading } = useWeather();

  if (loading || !weather) {
    return (
      <div className="flex h-full items-center justify-end">
        <p className="text-white/50">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-end justify-center">

      <div className="text-6xl">
        ☀️
      </div>

      <h2 className="mt-4 text-6xl font-light">
        {Math.round(weather.temp)}°
      </h2>

      <p className="mt-2 text-xl text-white/60 capitalize">
        {weather.description}
      </p>

    </div>
  );
}