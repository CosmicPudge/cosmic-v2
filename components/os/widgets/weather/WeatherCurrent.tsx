"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
  density?: "dense" | "comfortable" | "luxury";
}

export default function WeatherCurrent({
  weather,
  loading,
  density = "comfortable",
}: Props) {
  const dense = density === "dense";
  const luxury = density === "luxury";
  if (loading || !weather) {
    return (
      <div className={`flex items-center ${dense ? "gap-2" : "gap-6"}`}>
        <div className={`${dense ? "h-9 w-9" : "h-20 w-20"} animate-pulse rounded-full bg-white/10`} />

        <div className="flex flex-col gap-3">
          <div className={`${dense ? "h-5 w-14" : "h-10 w-32"} animate-pulse rounded-full bg-white/10`} />
          <div className={`${dense ? "h-2 w-12" : "h-5 w-24"} animate-pulse rounded-full bg-white/10`} />
        </div>
      </div>
    );
  }

  const isDay =
    weather.daylightProgress > 0 &&
    weather.daylightProgress < 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${weather.condition}-${weather.temp}`}
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: -10,
        }}
        transition={{
          duration: 0.35,
        }}
        className={`flex items-center ${dense ? "gap-2" : "gap-6"}`}
      >
        <WeatherIcon
          condition={mapWeatherCondition(
            weather.condition
          )}
          isDay={isDay}
          size={dense ? 36 : luxury ? 112 : 88}
        />

        <div className="flex flex-col">
          <div className={`${dense ? "text-3xl" : luxury ? "text-7xl" : "text-6xl"} font-bold leading-none tracking-tight`}>
            {Math.round(weather.temp)}°
          </div>

          <div className={`${dense ? "mt-0 text-[11px]" : "mt-2 text-xl"} font-medium text-white/85`}>
            {weather.condition}
          </div>

          <div className={`${dense ? "text-[9px]" : "mt-1 text-sm"} text-white/60`}>
            Feels like {Math.round(weather.feelsLike)}°
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
