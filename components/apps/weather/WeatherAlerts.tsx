"use client";

import SectionCard from "@/components/os/ui/SectionCard";
import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData;
}

export default function WeatherAlerts({
  weather,
}: Props) {
  if (weather.weatherAlerts.length === 0) {
    return (
      <SectionCard title="Weather Alerts">
        <p className="text-sm text-zinc-400">
          ✅ No active weather alerts.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Weather Alerts">
      <div className="space-y-4">
        {weather.weatherAlerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-4"
          >
            <h3 className="font-semibold text-yellow-300">
              ⚠️ {alert.event}
            </h3>

            <p className="mt-2 text-sm text-zinc-300">
              {alert.headline}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              Expires:{" "}
              {new Date(alert.expires).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}