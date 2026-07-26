"use client";

import { useMemo } from "react";

import type { WeatherData } from "@/engines/environment";
import { generateStars } from "@/components/icons/data/generateStars";

interface Props {
  weather: WeatherData | null;
}

export default function StarsLayer({
  weather,
}: Props) {
  const stars = useMemo(
    () =>
      generateStars({
        density: "dense",
        seed: "desktop",
      }),
    []
  );

  // Hide stars during the day
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 20) {
    return null;
  }

  // Hide stars during heavy weather
  const condition =
    weather?.condition.toLowerCase() ?? "";

  if (
    condition.includes("cloud") ||
    condition.includes("rain") ||
    condition.includes("storm") ||
    condition.includes("snow")
  ) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white cosmic-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.radius * 2}px`,
            height: `${star.radius * 2}px`,
            opacity: star.opacity,
            animationDelay: `-${star.phase}s`,
            animationDuration: `${star.speed}s`,
            boxShadow: `0 0 ${star.glowRadius * 8}px rgba(255,255,255,0.35)`,
          }}
        />
      ))}
    </div>
  );
}