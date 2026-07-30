"use client";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
  error: string | null;
  dense?: boolean;
}

function formatUpdated(time?: string) {
  if (!time) return "--";

  const date = new Date(time);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WeatherFooter({
  weather,
  error,
  dense = false,
}: Props) {
  if (error) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-red-300">
          Weather unavailable
        </span>

        <span className="text-white/40">
          Offline
        </span>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center justify-between">
        <span>Loading weather...</span>

        <span className="text-white/40">
          --
        </span>
      </div>
    );
  }

  const alerts = weather.weatherAlerts.length;

  return (
    <div className={`flex items-center justify-between ${dense ? "text-[8px]" : "text-sm"}`}>
      <span className="truncate text-white/55">
        Updated {formatUpdated(weather.lastUpdated)}
      </span>

      <div className={`flex shrink-0 items-center ${dense ? "gap-1" : "gap-3"}`}>
        <div className={`rounded-full border border-white/10 bg-white/5 ${dense ? "px-1.5 py-0.5" : "px-3 py-1"}`}>
          AQI {weather.airQuality.aqi}
        </div>

        {alerts > 0 && (
          <div className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1 text-yellow-300">
            {alerts} Alert{alerts !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
