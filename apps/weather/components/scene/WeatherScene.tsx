"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

import { useWeatherContext } from "../../context";

interface WeatherSceneProps {
  children: ReactNode;
  className?: string;
}

export default function WeatherScene({
  children,
  className,
}: WeatherSceneProps) {
  const { weather } = useWeatherContext();

  const condition =
    weather?.condition.toLowerCase() ?? "";

  const isNight =
    weather != null &&
    (weather.daylightProgress <= 0 ||
      weather.daylightProgress >= 100);

  let background =
    "from-sky-500 via-sky-400 to-cyan-300";

  if (condition.includes("cloud")) {
    background =
      "from-slate-500 via-slate-400 to-sky-300";
  }

  if (condition.includes("rain")) {
    background =
      "from-slate-900 via-slate-700 to-slate-500";
  }

  if (condition.includes("snow")) {
    background =
      "from-slate-300 via-sky-100 to-white";
  }

  if (condition.includes("thunder")) {
    background =
      "from-slate-950 via-slate-800 to-slate-700";
  }

  if (isNight) {
    background =
      "from-slate-950 via-indigo-950 to-slate-900";
  }

  return (
    <div
      className={clsx(
        "relative h-full overflow-hidden",
        className
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 bg-gradient-to-b transition-all duration-1000",
          background
        )}
      />

      <div
        className="
          pointer-events-none
          absolute
          -top-24
          left-1/2
          h-80
          w-80
          -translate-x-1/2
          rounded-full
          bg-white/10
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top,rgba(255,255,255,.18),transparent_55%)]
        "
      />

      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}