"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useDisplay } from "@/components/os/display";
import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";
import type { WeatherData } from "@/engines/environment";

import { HERO_LAYOUTS } from "./heroLayouts";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

export default function HeroWeather({
  weather,
  loading,
}: Props) {
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const iconSize =
    Math.round(hero.typography.temperature * 0.9);

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
        style={{
          minWidth: 0,
        }}
      >
        <div className="flex items-center gap-5">
          <WeatherIcon
            condition={mapWeatherCondition(
              weather.condition
            )}
            isDay={
              weather.daylightProgress > 0 &&
              weather.daylightProgress < 100
            }
            size={iconSize}
          />

          <div className="min-w-0 text-right">
            <div
              className="font-bold tracking-tight"
              style={{
                fontSize:
                  hero.typography.temperature,
                lineHeight: 1,
              }}
            >
              {Math.round(weather.temp)}°
            </div>

            <div
              className="mt-2 font-medium text-white/85"
              style={{
                fontSize:
                  hero.typography.weather,
              }}
            >
              {weather.condition}
            </div>

            <div
              className="text-white/60"
              style={{
                fontSize:
                  hero.typography.details,
              }}
            >
              {weather.city}
            </div>
          </div>
        </div>

        <div
          className="rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
          style={{
            paddingInline: 16,
            paddingBlock: 8,
            fontSize:
              hero.typography.details,
          }}
        >
          Feels like{" "}
          {Math.round(weather.feelsLike)}°
        </div>
      </motion.div>
    </AnimatePresence>
  );
}