"use client";

import { motion } from "framer-motion";

import { useDisplay } from "@/components/os/display";
import type { WeatherData } from "@/engines/environment";

import { HERO_LAYOUTS } from "./heroLayouts";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HeroSun({
  weather,
  loading,
}: Props) {
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const padding = hero.padding * 0.6;

  const labelSize = Math.max(
    11,
    hero.typography.details - 2
  );

  const valueSize = hero.typography.weather;

  const detailSize = hero.typography.details;

  if (loading || !weather) {
    return (
      <div
        className="animate-pulse rounded-3xl bg-white/5"
        style={{
          padding,
        }}
      >
        <div className="mb-5 h-4 w-32 rounded-full bg-white/10" />

        <div className="h-2 rounded-full bg-white/10" />
      </div>
    );
  }

  const progress = Math.min(
    100,
    Math.max(0, weather.daylightProgress)
  );

  return (
    <div
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
      style={{
        padding,
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p
            className="uppercase tracking-[0.18em] text-white/45"
            style={{
              fontSize: labelSize,
            }}
          >
            Daylight
          </p>

          <p
            className="mt-2 font-semibold"
            style={{
              fontSize: valueSize,
              lineHeight: 1.1,
            }}
          >
            {weather.dayLength}
          </p>
        </div>

        <div className="text-right">
          <p
            className="text-white/60"
            style={{
              fontSize: detailSize,
            }}
          >
            {Math.round(progress)}%
          </p>

          <p
            className="text-white/40"
            style={{
              fontSize: labelSize,
            }}
          >
            Complete
          </p>
        </div>
      </div>

      <div className="relative mb-5 h-2 rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-white/40"
          initial={{
            width: 0,
          }}
          animate={{
            width: `${progress}%`,
          }}
          transition={{
            duration: 1,
          }}
        />

        <motion.div
          className="
            absolute
            top-1/2
            h-5
            w-5
            -translate-y-1/2
            rounded-full
            border
            border-white/50
            bg-white
            shadow-[0_0_25px_rgba(255,255,255,0.7)]
          "
          animate={{
            left: `calc(${progress}% - 10px)`,
          }}
          transition={{
            duration: 1,
          }}
        />
      </div>

      <div
        className="flex justify-between text-white/65"
        style={{
          fontSize: detailSize,
        }}
      >
        <div>
          <p
            className="text-white/40"
            style={{
              fontSize: labelSize,
            }}
          >
            Sunrise
          </p>

          <p className="mt-1 font-medium">
            {formatTime(weather.sunrise)}
          </p>
        </div>

        <div className="text-right">
          <p
            className="text-white/40"
            style={{
              fontSize: labelSize,
            }}
          >
            Sunset
          </p>

          <p className="mt-1 font-medium">
            {formatTime(weather.sunset)}
          </p>
        </div>
      </div>
    </div>
  );
}