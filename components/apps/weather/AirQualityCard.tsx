"use client";

import SectionCard from "@/components/os/ui/SectionCard";
import type { WeatherData } from "@/engines/environment";
import { getAQILabel } from "@/engines/environment/utils/getAQILabel";

interface Props {
  weather: WeatherData;
}

export default function AirQualityCard({
  weather,
}: Props) {
  const quality = getAQILabel(
    weather.airQuality.aqi
  );

  return (
    <SectionCard title="Air Quality">

      <div className="space-y-6">

        <div className="text-center">

          <div className="text-6xl font-bold">
            {weather.airQuality.aqi}
          </div>

          <div
            className={`text-lg font-semibold ${quality.color}`}
          >
            {quality.label}
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">

          <div>
            <div className="text-white/50">
              PM2.5
            </div>

            <div>
              {weather.airQuality.pm25.toFixed(1)}
            </div>
          </div>

          <div>
            <div className="text-white/50">
              PM10
            </div>

            <div>
              {weather.airQuality.pm10.toFixed(1)}
            </div>
          </div>

          <div>
            <div className="text-white/50">
              Ozone
            </div>

            <div>
              {weather.airQuality.ozone.toFixed(0)}
            </div>
          </div>

          <div>
            <div className="text-white/50">
              NO₂
            </div>

            <div>
              {weather.airQuality.no2.toFixed(0)}
            </div>
          </div>

        </div>

      </div>

    </SectionCard>
  );
}