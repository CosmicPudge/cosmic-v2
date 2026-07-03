"use client";

import WeatherIcon from "@/components/os/ui/WeatherIcon";
import SectionCard from "@/components/os/ui/SectionCard";

import type { WeatherData } from "@/engines/environment";
import { formatWeather } from "@/utils/os/formatWeather";
import { formatTime } from "@/utils/os/formatTime";

interface CurrentWeatherProps {
  weather: WeatherData;
}

export default function CurrentWeather({
  weather,
}: CurrentWeatherProps) {
  return (
    <SectionCard title="Current Weather">
      <div className="flex flex-col items-center text-center">

        {/* Weather Icon */}
        <div className="mb-6">
          <WeatherIcon icon={weather.icon} />
        </div>

        {/* Temperature */}
        <h1 className="text-8xl font-black tracking-tight">
          {weather.temp}°
        </h1>

        {/* Condition */}
        <p className="mt-2 text-3xl font-medium text-white/90">
          {formatWeather(weather.description)}
        </p>

        {/* High / Low / Feels */}
        <p className="mt-3 text-lg text-white/60">
          H {weather.high}° • L {weather.low}° • Feels Like {weather.feelsLike}°
        </p>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-white/10" />

        {/* Bottom Information */}
        <div className="grid w-full grid-cols-2 gap-6 text-center">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Location
            </p>

            <p className="mt-2 text-lg font-medium">
              {weather.city}, UT
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Updated
            </p>

            <p className="mt-2 text-lg font-medium">
              {formatTime(weather.lastUpdated)}
            </p>
          </div>

        </div>

      </div>
    </SectionCard>
  );
}