"use client";

import { motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

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
  if (loading || !weather) {
    return (
      <div className="animate-pulse rounded-3xl bg-white/5 p-6">
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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            Daylight
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {weather.dayLength}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-white/60">
            {Math.round(progress)}%
          </p>

          <p className="text-xs text-white/40">
            Complete
          </p>
        </div>
      </div>

      <div className="relative mb-5 h-2 rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-white/40"
          initial={{ width: 0 }}
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

      <div className="flex justify-between text-sm text-white/65">
        <div>
          <p className="text-white/40">Sunrise</p>
          <p className="mt-1 font-medium">
            {formatTime(weather.sunrise)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-white/40">Sunset</p>
          <p className="mt-1 font-medium">
            {formatTime(weather.sunset)}
          </p>
        </div>
      </div>
    </div>
  );
}