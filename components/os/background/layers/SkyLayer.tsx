"use client";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
}

export default function SkyLayer({ weather }: Props) {
  const hour = new Date().getHours();

  const isNight = hour < 6 || hour >= 20;
  const isSunrise = hour >= 5 && hour < 7;
  const isSunset = hour >= 18 && hour < 20;

  let gradient =
    "from-slate-950 via-slate-900 to-slate-950";

  if (isSunrise) {
    gradient =
      "from-orange-300 via-pink-300 to-sky-400";
  } else if (isSunset) {
    gradient =
      "from-orange-500 via-purple-700 to-slate-900";
  } else if (isNight) {
    gradient =
      "from-slate-950 via-indigo-950 to-slate-900";
  } else {
    gradient =
      "from-sky-400 via-sky-500 to-cyan-300";
  }

  if (weather) {
    const condition = weather.condition.toLowerCase();

    if (condition.includes("rain")) {
      gradient =
        "from-slate-900 via-slate-800 to-blue-950";
    }

    if (condition.includes("snow")) {
      gradient =
        "from-slate-300 via-slate-500 to-slate-700";
    }

    if (condition.includes("cloud")) {
      gradient =
        "from-slate-700 via-slate-600 to-slate-800";
    }

    if (condition.includes("storm")) {
      gradient =
        "from-black via-slate-900 to-purple-950";
    }
  }

  return (
    <>
      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-b
          ${gradient}
          transition-all
          duration-[6000ms]
        `}
      />

      {/* Atmosphere glow */}

      <div
        className="
          absolute
          inset-0
          opacity-40
          animate-pulse
          bg-[radial-gradient(circle_at_top,#ffffff20,transparent_65%)]
        "
      />
    </>
  );
}