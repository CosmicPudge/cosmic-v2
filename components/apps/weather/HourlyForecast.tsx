"use client";

import SectionCard from "@/components/os/ui/SectionCard";
import HourlyForecastCard from "./HourlyForecastCard";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData;
}

export default function HourlyForecast({
  weather,
}: Props) {
  return (
    <SectionCard title="Hourly Forecast">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {weather.hourlyForecast.map((hour) => (
          <HourlyForecastCard
            key={hour.time}
            time={hour.time}
            temp={hour.temp}
          />
        ))}
      </div>
    </SectionCard>
  );
}