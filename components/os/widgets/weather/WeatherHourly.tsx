"use client";

import { motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
  density?: "dense" | "comfortable" | "luxury";
}

export default function WeatherHourly({
  weather,
  loading,
  density = "comfortable",
}: Props) {
  const dense = density === "dense";
  const luxury = density === "luxury";
  if (loading || !weather) {
    return (
      <div className={`flex ${dense ? "gap-1" : "gap-4"} overflow-visible`}>
        {Array.from({ length: dense ? 3 : 6 }).map((_, index) => (
          <div
            key={index}
            className={`${dense ? "h-7 flex-1" : "h-28 w-20"} shrink-0 animate-pulse rounded-2xl bg-white/10`}
          />
        ))}
      </div>
    );
  }

  const hours = weather.hourlyForecast.slice(0, dense ? 3 : luxury ? 6 : 4);

  return (
    <div className={dense ? "space-y-1" : "space-y-5"}>
      <p className={`${dense ? "text-[7px] tracking-[0.12em]" : "text-xs tracking-[0.25em]"} uppercase text-white/45`}>
        Next Hours
      </p>

      <div className={`flex ${dense ? "gap-1" : "gap-4"} overflow-visible`}>
        {hours.map((hour, index) => {
          const isDayIcon = hour.icon.endsWith("d");

          return (
            <motion.div
              key={`${hour.time}-${index}`}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              className={`flex items-center rounded-2xl bg-white/[0.04] ${dense ? "min-w-0 flex-1 justify-between px-1.5 py-1" : "w-20 shrink-0 flex-col px-3 py-4"}`}
            >
              <p className={`${dense ? "text-[8px]" : "text-xs"} text-white/55`}>
                {hour.time}
              </p>

              <div className={dense ? "mx-1" : "my-3"}>
                <WeatherIcon
                  condition={mapWeatherCondition(hour.icon)}
                  isDay={isDayIcon}
                  size={dense ? 15 : luxury ? 50 : 42}
                />
              </div>

              <p className={`${dense ? "text-[10px]" : "text-lg"} font-semibold`}>
                {Math.round(hour.temp)}°
              </p>

              {!dense && <p className="mt-1 text-[10px] text-white/45">
                {hour.precipitationChance}%
              </p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
