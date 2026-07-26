"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";

import WidgetCard from "@/components/os/ui/widget/WidgetCard";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

export default function WeatherCurrent({
  weather,
  loading,
}: Props) {
  if (loading || !weather) {
    return (
      <WidgetCard>
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />

          <div className="flex flex-col gap-3">
            <div className="h-10 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </WidgetCard>
    );
  }

  const isDay =
    weather.daylightProgress > 0 &&
    weather.daylightProgress < 100;

  return (
    <WidgetCard>
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
          className="flex items-center gap-6"
        >
          <WeatherIcon
            condition={mapWeatherCondition(
              weather.condition
            )}
            isDay={isDay}
            size={88}
          />

          <div className="flex flex-col">
            <div className="text-6xl font-bold leading-none tracking-tight">
              {Math.round(weather.temp)}°
            </div>

            <div className="mt-2 text-xl font-medium text-white/85">
              {weather.condition}
            </div>

            <div className="mt-1 text-sm text-white/60">
              Feels like {Math.round(weather.feelsLike)}°
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </WidgetCard>
  );
}