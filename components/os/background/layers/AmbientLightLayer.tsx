"use client";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
}

export default function AmbientLightLayer({ weather }: Props) {
  const hour = new Date().getHours();

  const isNight = hour < 6 || hour >= 20;

  let color = "#ffffff";
  let opacity = 0.08;

  const condition = weather?.condition.toLowerCase() ?? "";

  if (isNight) {
    color = "#88AAFF";
    opacity = 0.05;
  }

  if (condition.includes("rain")) {
    color = "#6EA7FF";
    opacity = 0.08;
  }

  if (condition.includes("storm")) {
    color = "#6B5CFF";
    opacity = 0.10;
  }

  if (condition.includes("snow")) {
    color = "#FFFFFF";
    opacity = 0.12;
  }

  return (
    <>
      {/* Top ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top, ${color}, transparent 65%)`,
          opacity,
        }}
      />

      {/* Bottom bounce light */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at bottom, rgba(255,255,255,0.05), transparent 70%)",
        }}
      />
    </>
  );
}