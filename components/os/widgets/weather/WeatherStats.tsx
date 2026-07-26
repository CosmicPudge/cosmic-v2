"use client";

import { motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

import WidgetCard from "@/components/os/ui/widget/WidgetCard";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({
  label,
  value,
}: StatProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>

      <span className="mt-1 text-xl font-semibold">
        {value}
      </span>
    </div>
  );
}

export default function WeatherStats({
  weather,
  loading,
}: Props) {
  if (loading || !weather) {
    return (
      <WidgetCard>
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-white/10"
            />
          ))}
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard>
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
        className="grid grid-cols-2 gap-x-8 gap-y-6"
      >
        <Stat
          label="High"
          value={`${Math.round(weather.high)}°`}
        />

        <Stat
          label="Low"
          value={`${Math.round(weather.low)}°`}
        />

        <Stat
          label="Humidity"
          value={`${weather.humidity}%`}
        />

        <Stat
          label="Wind"
          value={`${Math.round(weather.windSpeed)} mph`}
        />
      </motion.div>
    </WidgetCard>
  );
}