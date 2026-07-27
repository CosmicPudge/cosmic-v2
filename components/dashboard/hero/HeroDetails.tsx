"use client";

import { motion } from "framer-motion";

import { useDisplay } from "@/components/os/display";
import type { WeatherData } from "@/engines/environment";

import { HERO_LAYOUTS } from "./heroLayouts";

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
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const paddingY = hero.padding * 0.45;
  const paddingX = hero.padding * 0.5;

  const labelSize = Math.max(
    11,
    hero.typography.details - 2
  );

  return (
    <motion.div
      whileHover={{
        y: -2,
        scale: 1.02,
      }}
      transition={{
        duration: 0.2,
      }}
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
      "
      style={{
        paddingInline: paddingX,
        paddingBlock: paddingY,
      }}
    >
      <p
        className="uppercase tracking-[0.18em] text-white/45"
        style={{
          fontSize: labelSize,
        }}
      >
        {label}
      </p>

      <p
        className="mt-2 font-semibold"
        style={{
          fontSize: hero.typography.weather,
          lineHeight: 1.15,
        }}
      >
        {value}
      </p>
    </motion.div>
  );
}

export default function HeroDetails({
  weather,
  loading,
}: Props) {
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  if (loading || !weather) {
    return (
      <div
        className="grid w-full grid-cols-2"
        style={{
          gap: hero.gap,
        }}
      >
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
    <div
      className="grid w-full grid-cols-2"
      style={{
        gap: hero.gap,
      }}
    >
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