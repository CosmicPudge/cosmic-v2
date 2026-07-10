"use client";

import SectionCard from "@/components/os/ui/SectionCard";
import WeatherIcon from "@/components/os/ui/WeatherIcon";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData;
}

export default function DailyForecast({
  weather,
}: Props) {
  return (
    <SectionCard title="7-Day Forecast">
      <div className="space-y-2">
        {weather.dailyForecast.map((day) => (
          <div
            key={day.day}
            className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <WeatherIcon
                icon={day.icon}
                className="text-3xl"
              />

              <span className="font-medium">
                <div>
                  <div className="font-semibold">
                    {day.day}
                  </div>

                  <div className="text-sm text-white/50">
                    {day.date}
                  </div>
                </div>
              </span>
            </div>

            <div className="flex gap-4 font-semibold">
              <span>{day.high}°</span>

              <span className="text-white/50">
                {day.low}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}