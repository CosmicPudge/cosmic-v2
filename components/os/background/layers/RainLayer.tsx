"use client";

import { useMemo } from "react";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
}

interface RainDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
  length: number;
  opacity: number;
}

export default function RainLayer({ weather }: Props) {
  const condition = weather?.condition.toLowerCase() ?? "";

  if (
    !condition.includes("rain") &&
    !condition.includes("drizzle") &&
    !condition.includes("storm")
  ) {
    return null;
  }

  const drops = useMemo<RainDrop[]>(
    () =>
      Array.from({ length: 180 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.6 + Math.random() * 0.8,
        length: 18 + Math.random() * 18,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute"
          style={{
            left: `${drop.left}%`,
            top: "-40px",
            width: "1px",
            height: `${drop.length}px`,
            opacity: drop.opacity,
            background:
              "linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))",
            animation: `cosmic-rain ${drop.duration}s linear infinite`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}
    </div>
  );
}