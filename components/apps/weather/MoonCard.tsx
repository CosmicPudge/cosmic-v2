"use client";

import SectionCard from "@/components/os/ui/SectionCard";
import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData;
}

export default function MoonCard({
  weather,
}: Props) {
  const astronomy = weather.astronomy;

  return (
    <SectionCard title="Moon">

      <div className="flex flex-col items-center gap-4">

        <div className="relative h-32 w-32 rounded-full bg-gray-100">

        </div>

        <div className="text-2xl font-semibold">
          {astronomy.moonPhaseName}
        </div>

        <div className="text-white/70">
          {astronomy.illumination}% Illuminated
        </div>

        <div className="w-full border-t border-white/10 pt-4">

          <div className="flex justify-between">
            <span>Next Full Moon</span>

            <span className="font-semibold">
              {astronomy.nextFullMoon}
            </span>
          </div>

          <div className="mt-3 flex justify-between">

            <span>Next New Moon</span>

            <span className="font-semibold">
              {astronomy.nextNewMoon}
            </span>

          </div>

        </div>

      </div>

    </SectionCard>
  );
}