"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { WeatherData } from "@/engines/environment";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";

// Update this import if your WeatherIcon component lives elsewhere.
import WeatherIcon from "@/components/icons/weather/WeatherIcon";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

export default function HeroWeather({
  weather,
  loading,
}: Props) {
  if (loading || !weather) {
    return (
      <div className="flex flex-col items-end gap-3">
        <div className="h-28 w-40 animate-pulse rounded-3xl bg-white/10" />
        <div className="h-6 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${weather.condition}-${weather.temp}`}
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: -12,
        }}
        transition={{
          duration: 0.4,
        }}
        className="flex flex-col items-end gap-2"
      >
        <div className="flex items-center gap-5">
          <WeatherIcon
    condition={mapWeatherCondition(weather.condition)}
    isDay={weather.daylightProgress > 0 && weather.daylightProgress < 100}
    size={84}
/>

          <div className="text-right">
            <div className="text-8xl font-bold leading-none tracking-tight">
              {Math.round(weather.temp)}°
            </div>

            <div className="mt-2 text-2xl font-medium text-white/85">
              {weather.condition}
            </div>

            <div className="text-base text-white/60">
              {weather.city}
            </div>
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 backdrop-blur-xl">
          Feels like {Math.round(weather.feelsLike)}°
        </div>
      </motion.div>
    </AnimatePresence>
  );
}