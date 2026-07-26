"use client";

import { motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";

import WidgetCard from "@/components/os/ui/widget/WidgetCard";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

export default function WeatherHourly({
  weather,
  loading,
}: Props) {
  if (loading || !weather) {
    return (
      <WidgetCard>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="
                h-28
                w-20
                shrink-0
                animate-pulse
                rounded-2xl
                bg-white/10
              "
            />
          ))}
        </div>
      </WidgetCard>
    );
  }

  const hours = weather.hourlyForecast.slice(0, 6);

  return (
    <WidgetCard>
      <div className="space-y-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/45">
          Next Hours
        </p>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
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
                className="
                  flex
                  w-20
                  shrink-0
                  flex-col
                  items-center

                  rounded-2xl

                  bg-white/[0.04]

                  px-3
                  py-4
                "
              >
                <p className="text-xs text-white/55">
                  {hour.time}
                </p>

                <div className="my-3">
                  <WeatherIcon
                    condition={mapWeatherCondition(hour.icon)}
                    isDay={isDayIcon}
                    size={42}
                  />
                </div>

                <p className="text-lg font-semibold">
                  {Math.round(hour.temp)}°
                </p>

                <p className="mt-1 text-[10px] text-white/45">
                  {hour.precipitationChance}%
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </WidgetCard>
  );
}