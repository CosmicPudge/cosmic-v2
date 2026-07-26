"use client";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
}

interface Cloud {
  id: number;
  top: number;
  left: number;
  width: number;
  height: number;
  opacity: number;
  duration: number;
  delay: number;
}

const CLOUDS: Cloud[] = [
  {
    id: 1,
    top: 12,
    left: -20,
    width: 260,
    height: 90,
    opacity: 0.18,
    duration: 120,
    delay: 0,
  },
  {
    id: 2,
    top: 28,
    left: -35,
    width: 340,
    height: 110,
    opacity: 0.14,
    duration: 180,
    delay: -40,
  },
  {
    id: 3,
    top: 8,
    left: -45,
    width: 200,
    height: 70,
    opacity: 0.12,
    duration: 150,
    delay: -70,
  },
];

export default function CloudLayer({ weather }: Props) {
  const condition =
    weather?.condition.toLowerCase() ?? "";

  let multiplier = 0;

  if (condition.includes("cloud")) multiplier = 1;
  if (condition.includes("rain")) multiplier = 1.4;
  if (condition.includes("storm")) multiplier = 1.8;

  if (multiplier === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {CLOUDS.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute rounded-full bg-white/60 blur-3xl"
          style={{
            top: `${cloud.top}%`,
            left: `${cloud.left}%`,
            width: `${cloud.width}px`,
            height: `${cloud.height}px`,
            opacity: cloud.opacity * multiplier,
            animation: `cloudDrift ${cloud.duration}s linear infinite`,
            animationDelay: `${cloud.delay}s`,
          }}
        />
      ))}
    </div>
  );
}