"use client";

import { useState } from "react";

import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import type { WeatherCondition } from "@/components/icons/weather/types";


const backgrounds = {
  dark: {
    page:
      "bg-slate-950 text-white",
    card:
      "bg-white/5 border-white/10",
  },

  light: {
    page:
      "bg-slate-100 text-slate-900",
    card:
      "bg-white border-slate-300",
  },

  aurora: {
    page:
      "bg-[length:300%_300%] bg-gradient-to-br from-sky-950 via-cyan-900 via-emerald-800 to-indigo-950 animate-cosmic-gradient text-white",

    card:
      "bg-cyan-500/10 border-cyan-300/20 backdrop-blur-xl",
  },

  sunset: {
    page:
      "bg-[length:300%_300%] bg-gradient-to-br from-orange-400 via-pink-500 to-purple-900 animate-cosmic-gradient text-white",

    card:
      "bg-orange-300/10 border-orange-200/20 backdrop-blur-xl",
  },

  cosmic: {
    page:
      "bg-[length:400%_400%] bg-gradient-to-br from-violet-950 via-fuchsia-900 via-indigo-900 to-slate-950 animate-cosmic-gradient text-white",

    card:
      "bg-violet-500/10 border-violet-300/20 backdrop-blur-xl",
  },

  forest: {
    page:
      "bg-[length:300%_300%] bg-gradient-to-br from-green-950 via-emerald-900 to-lime-900 animate-cosmic-gradient text-white",

    card:
      "bg-green-500/10 border-green-300/20 backdrop-blur-xl",
  },

  ocean: {
    page:
      "bg-[length:300%_300%] bg-gradient-to-br from-sky-950 via-blue-800 to-cyan-700 animate-cosmic-gradient text-white",

    card:
      "bg-sky-500/10 border-sky-300/20 backdrop-blur-xl",
  },
};

const icons: {
  title: string;
  condition: WeatherCondition;
  isDay: boolean;
}[] = [
    {
      title: "Clear Day",
      condition: "clear",
      isDay: true,
    },
    {
      title: "Clear Night",
      condition: "clear",
      isDay: false,
    },
    {
      title: "Partly Cloudy Day",
      condition: "partly-cloudy",
      isDay: true,
    },
    {
      title: "Partly Cloudy Night",
      condition: "partly-cloudy",
      isDay: false,
    },
    {
      title: "Cloudy",
      condition: "cloudy",
      isDay: true,
    },
    {
      title: "Rain",
      condition: "rain",
      isDay: true,
    },
    {
      title: "Snow",
      condition: "snow",
      isDay: true,
    },
    {
      title: "Thunderstorm",
      condition: "thunderstorm",
      isDay: true,
    },
    {
      title: "Wind",
      condition: "wind",
      isDay: true,
    },
  ];

export default function IconDevPage() {
  const [size, setSize] = useState(90);

  const [background, setBackground] =
    useState<keyof typeof backgrounds>("dark");

    const [starDensity, setStarDensity] =
  useState<"sparse" | "normal" | "dense">(
    "normal"
  );

  return (
    <main
      className={`min-h-screen p-10 transition-all duration-500 ${backgrounds[background].page}`}
    >
      <h1 className="mb-3 text-5xl font-bold">
        🌌 Cosmic Icon Lab
      </h1>

      <p className="mb-10 opacity-70">
        Live preview of every weather icon used throughout Cosmic.
      </p>

      {/* Controls */}

      <div
        className={`mb-10 rounded-2xl border p-6 backdrop-blur ${backgrounds[background].card}`}
      >
        <label className="mb-3 block text-lg font-semibold">
          Icon Size
        </label>

        <input
          type="range"
          min={32}
          max={160}
          value={size}
          onChange={(e) =>
            setSize(Number(e.target.value))
          }
          className="w-full cursor-pointer"
        />

        <div className="mt-2 opacity-60">
          {size}px
        </div>

        <label className="mt-8 mb-2 block text-lg font-semibold">
          Background
        </label>

        <select
          value={background}
          onChange={(e) =>
            setBackground(
              e.target.value as keyof typeof backgrounds
            )
          }
          className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white shadow-lg"
        >
          <option value="dark">🌙 Dark</option>

          <option value="light">☀️ Light</option>

          <option value="sunset">🌅 Sunset</option>

          <option value="aurora">🌌 Aurora</option>

          <option value="cosmic">🚀 Cosmic</option>

          <option value="forest">🌲 Forest</option>

          <option value="ocean">🌊 Ocean</option>
        </select>

        <label className="mt-8 mb-2 block text-lg font-semibold">
          Star Density
        </label>

        <select
          value={starDensity}
          onChange={(e) =>
            setStarDensity(
              e.target.value as
              | "sparse"
              | "normal"
              | "dense"
            )
          }
          className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white shadow-lg"
        >
          <option value="sparse">Sparse</option>
          <option value="normal">Normal</option>
          <option value="dense">Dense</option>
        </select>
      </div>

      {/* Icon Grid */}

      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 xl:grid-cols-4">
        {icons.map((icon) => (
          <div
            key={icon.title}
            className={`rounded-2xl border p-8 backdrop-blur transition-all duration-300 hover:scale-[1.03] ${backgrounds[background].card}`}
          >
            <div className="flex justify-center">
              <WeatherIcon
                condition={icon.condition}
                isDay={icon.isDay}
                size={size}
                options={{
                  starDensity,
                }}
              />
            </div>

            <h2 className="mt-6 text-center text-lg font-semibold">
              {icon.title}
            </h2>

            <p className="mt-1 text-center text-sm opacity-50">
              {icon.condition}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}