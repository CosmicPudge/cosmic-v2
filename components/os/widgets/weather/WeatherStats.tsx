"use client";

import { motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
  density?: "dense" | "comfortable" | "luxury";
}

interface StatProps {
  label: string;
  value: string;
  dense: boolean;
}

function Stat({
  label,
  value,
  dense,
}: StatProps) {
  return (
    <div className="flex flex-col">
      <span className={`${dense ? "text-[7px] leading-none tracking-[0.08em]" : "text-[11px] tracking-[0.18em]"} uppercase text-white/45`}>
        {label}
      </span>

      <span className={`${dense ? "mt-0.5 text-[11px] leading-none" : "mt-1 text-xl"} font-semibold`}>
        {value}
      </span>
    </div>
  );
}

export default function WeatherStats({
  weather,
  loading,
  density = "comfortable",
}: Props) {
  const dense = density === "dense";
  if (loading || !weather) {
    return (
      <div className={`grid grid-cols-3 ${dense ? "gap-x-2 gap-y-1" : "gap-x-8 gap-y-6"}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`${dense ? "h-6" : "h-12"} animate-pulse rounded-xl bg-white/10`}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
      }}
      className={`grid grid-cols-3 ${dense ? "gap-x-2 gap-y-1" : "gap-x-8 gap-y-6"}`}
    >
      <Stat
        label="High"
        value={`${Math.round(weather.high)}°`}
        dense={dense}
      />

      <Stat
        label="Low"
        value={`${Math.round(weather.low)}°`}
        dense={dense}
      />

      <Stat
        label="Humidity"
        value={`${weather.humidity}%`}
        dense={dense}
      />

      <Stat
        label="Wind"
        value={`${Math.round(weather.windSpeed)} mph`}
        dense={dense}
      />

      <Stat
        label="UV Index"
        value={`${weather.uvIndex}`}
        dense={dense}
      />

      <Stat
        label="Air Quality"
        value={`AQI ${weather.airQuality.aqi}`}
        dense={dense}
      />
    </motion.div>
  );
}
