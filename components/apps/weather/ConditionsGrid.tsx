"use client";

import StatCard from "@/components/os/ui/StatCard";
import GridSurface from "@/components/os/ui/surfaces/GridSurface";

import type { WeatherData } from "@/engines/environment";
import { degreesToCompass } from "@/utils/os/degreesToCompass";

interface ConditionsGridProps {
  weather: WeatherData;
  
}

export default function ConditionsGrid({
  weather,
}: ConditionsGridProps) {
  return (
    <GridSurface>

      <StatCard
        title="Feels Like"
        value={`${weather.feelsLike}°`}
      />

      <StatCard
        title="Humidity"
        value={`${weather.humidity}%`}
      />

      <StatCard
        title="Wind"
        value={`${degreesToCompass(
          weather.windDirection
        )} • ${weather.windSpeed} mph`}
      />

      <StatCard
        title="High"
        value={`${weather.high}°`}
      />

      <StatCard
        title="24h Rain"
        value={`${weather.precipitation24h}"`}
      />

      <StatCard
        title="Low"
        value={`${weather.low}°`}
      />



    </GridSurface>
  );
}