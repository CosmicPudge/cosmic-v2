"use client";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
}

export default function SunMoonLayer({ weather }: Props) {
  const now = new Date();

  const hour = now.getHours() + now.getMinutes() / 60;

  const isNight = hour < 6 || hour >= 20;

  // Normalize position across the visible sky (0 → 1)
  const progress = isNight
    ? hour >= 20
      ? (hour - 20) / 10
      : (hour + 4) / 10
    : (hour - 6) / 14;

  const x = progress * 80 + 10;

  // Arc across the sky
  const y = 65 - Math.sin(progress * Math.PI) * 45;

  void weather;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute transition-all duration-[60000ms] ease-linear"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {isNight ? (
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-slate-100 opacity-95" />
            <div className="absolute inset-0 rounded-full blur-3xl bg-white/20 scale-150" />
          </div>
        ) : (
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-yellow-300" />
            <div className="absolute inset-0 rounded-full blur-3xl bg-yellow-300/40 scale-150" />
          </div>
        )}
      </div>
    </div>
  );
}