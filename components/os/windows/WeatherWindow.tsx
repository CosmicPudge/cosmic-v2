"use client";

import { useEffect, useState } from "react";
import WeatherIcon from "@/components/os/ui/WeatherIcon";
import AppWindow from "./AppWindow";
import { formatWeather } from "@/utils/os/formatWeather";
import { formatTime } from "@/utils/os/formatTime";
import useLocation from "@/hooks/os/useLocation";
import Skeleton from "@/components/os/ui/Skeleton";
import { formatUnixTime } from "@/utils/os/formatUnixTime";
import {
  degreesToCompass,
} from "@/utils/os/degreesToCompass";


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

    // Load immediately
    loadWeather();

    // Refresh every 15 minutes
    const interval = setInterval(loadWeather, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location]);

  if (loading) {
    return (
      <AppWindow
        title="Weather"
        windowName="weather"
      >
        <div className="space-y-6">

          <Skeleton className="h-20 w-48" />

          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>

          <Skeleton className="h-52" />

          <Skeleton className="h-20" />

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

        <div className="flex items-center gap-6">
          <WeatherIcon icon={weather.icon} />

          <div>
            <h1 className="text-5xl font-bold">
              {weather.temp}°
            </h1>

            {formatWeather(weather.description)}

            <p className="text-white/60">
              {weather.city}, UT
            </p>
          </div>
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
            title="24h Precip."
            value={`${weather.precipitation24h}"`}
          />

          <StatCard
            title="Low"
            value={`${weather.low}°`}
          />

        </div>
        <SectionCard title="Sun">

          <InfoRow
            label="🌅 Sunrise"
            value={formatUnixTime(weather.sunrise)}
          />

          <InfoRow
            label="🌇 Sunset"
            value={formatUnixTime(weather.sunset)}
          />

        </SectionCard>

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
              Updated {formatTime(weather.lastUpdated)}
            </span>

          </div>

        </SectionCard>

      </div>
    </AppWindow>
  );
}