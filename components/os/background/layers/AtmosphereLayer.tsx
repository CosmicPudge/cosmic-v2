"use client";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
}

export default function AtmosphereLayer({ weather }: Props) {
  const hour = new Date().getHours();

  const isNight = hour < 6 || hour >= 20;
  const isSunrise = hour >= 5 && hour < 7;
  const isSunset = hour >= 18 && hour < 20;

  let overlay = "transparent";
  let opacity = 0;

  if (isSunrise) {
    overlay = "#FFB870";
    opacity = 0.12;
  } else if (isSunset) {
    overlay = "#FF8C5A";
    opacity = 0.15;
  } else if (isNight) {
    overlay = "#304A78";
    opacity = 0.08;
  }

  const condition = weather?.condition.toLowerCase() ?? "";

  if (condition.includes("rain")) {
    overlay = "#4A6EA8";
    opacity = 0.16;
  }

  if (condition.includes("storm")) {
    overlay = "#1F2438";
    opacity = 0.24;
  }

  if (condition.includes("snow")) {
    overlay = "#D8E7F5";
    opacity = 0.12;
  }

  return (
    <>
      {/* Full-screen color grading */}
      <div
        className="absolute inset-0 transition-all duration-[4000ms]"
        style={{
          background: overlay,
          opacity,
        }}
      />

      {/* Top light bloom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top center, rgba(255,255,255,0.18), transparent 60%)",
          opacity: opacity * 1.5,
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.25), transparent 45%)",
        }}
      />
    </>
  );
}