"use client";

import { motion } from "framer-motion";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({
  label,
  value,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/5
        px-5
        py-4
        backdrop-blur-xl
      "
    >
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </motion.div>
  );
}

export default function HeroDetails({
  weather,
  loading,
}: Props) {
  if (loading || !weather) {
    return (
      <div className="grid w-full grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="
              h-24
              animate-pulse
              rounded-2xl
              bg-white/10
            "
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <MetricCard
        label="High / Low"
        value={`${Math.round(weather.high)}° / ${Math.round(
          weather.low
        )}°`}
      />

      <MetricCard
        label="Humidity"
        value={`${weather.humidity}%`}
      />

      <MetricCard
        label="Wind"
        value={`${Math.round(weather.windSpeed)} mph`}
      />

      <MetricCard
        label="Day Length"
        value={weather.dayLength}
      />
    </div>
  );
}