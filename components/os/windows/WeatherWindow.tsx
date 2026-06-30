"use client";

import { useEffect, useState } from "react";

import AppWindow from "./AppWindow";

import useLocation from "@/hooks/os/useLocation";

import {
  getWeather,
  WeatherData,
} from "@/services/weatherService";

import StatCard from "../ui/StatCard";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";
import InfoRow from "@/components/os/ui/InfoRow";

export default function WeatherWindow() {
  const location = useLocation();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) return;

    const { lat, lon } = location;

    async function loadWeather() {
      try {
        const data = await getWeather(lat, lon);
        setWeather(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [location]);

  if (loading) {
    return (
      <AppWindow title="Weather" windowName="weather">
        <div className="flex h-64 items-center justify-center">
          Loading weather...
        </div>
      </AppWindow>
    );
  }

  if (!weather) {
    return (
      <AppWindow title="Weather" windowName="weather">
        <div className="flex h-64 items-center justify-center">
          Unable to load weather.
        </div>
      </AppWindow>
    );
  }

  return (
    <AppWindow
      title="Weather"
      windowName="weather"
    >
      <div className="space-y-6">

        {/* Header */}

        <div>
          <h1 className="text-5xl font-bold">
            {weather.temp}°
          </h1>

          <p className="text-xl text-white/80">
            {weather.description}
          </p>

          <p className="text-sm text-white/50">
            {weather.city}
          </p>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-2 gap-4">

          <StatCard
            title="Feels Like"
            value={`${weather.feelsLike}°`}
          />

          <StatCard
            title="Humidity"
            value={`${weather.humidity}%`}
          />

          <StatCard
            title="High"
            value={`${weather.high}°`}
          />

          <StatCard
            title="Low"
            value={`${weather.low}°`}
          />

        </div>

        {/* Hourly Forecast */}

        <SectionCard title="Hourly Forecast">

          <div className="space-y-1">

            {weather.hourlyForecast.map((hour) => (
              <InfoRow
                key={hour.time}
                label={hour.time}
                value={`${hour.temp}°`}
              />
            ))}

          </div>

        </SectionCard>

        {/* Status */}

        <SectionCard title="Status">

          <div className="flex items-center justify-between">

            <StatusBadge
              label={weather.condition}
              color="green"
            />

            <span className="text-sm text-white/50">
              Updated just now
            </span>

          </div>

        </SectionCard>

      </div>
    </AppWindow>
  );
}