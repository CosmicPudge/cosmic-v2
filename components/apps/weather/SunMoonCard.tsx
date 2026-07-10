"use client";

import SectionCard from "@/components/os/ui/SectionCard";
import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData;
}

export default function SunMoonCard({
  weather,
}: Props) {
  const sunrise = new Date(weather.sunrise * 1000);

  const sunset = new Date(weather.sunset * 1000);

  return (
    <SectionCard title="Sun & Moon">
      <div className="space-y-6">

        {/* Sun Progress */}
        <div>
          <div className="mb-2 flex justify-between text-xs text-zinc-400">
            <span>🌅</span>
            <span>☀️</span>
            <span>🌇</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-700"
              style={{
                width: `${weather.daylightProgress}%`,
              }}
            />
          </div>

          <p className="mt-2 text-center text-xs text-zinc-400">
            {weather.daylightProgress.toFixed(0)}% of today's daylight has elapsed
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Sunrise
            </p>

            <p className="mt-1 text-lg font-semibold">
              {sunrise.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Day Length
            </p>

            <p className="mt-1 text-lg font-semibold">
              {weather.dayLength}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Sunset
            </p>

            <p className="mt-1 text-lg font-semibold">
              {sunset.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

        </div>

      </div>
    </SectionCard>
  );
}