"use client";

import GlassPanel from "../ui/GlassPanel";
import WidgetCard from "./WidgetCard";
import useWeather from "@/hooks/os/useWeather";
import WeatherIcon from "@/components/os/ui/WeatherIcon";

export default function WeatherWidget() {
  const {
  weather,
  loading,
} = useWeather();
  return (
    <WidgetCard route="/weather">
  <GlassPanel>

    {loading || !weather ? (

      <div className="py-8 text-center text-white/50">
        Loading weather...
      </div>

    ) : (

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm uppercase tracking-widest text-white/50">
            Weather
          </p>

          <h2 className="mt-2 text-6xl font-bold">
            {weather.temp}°
          </h2>

          <p className="text-lg text-white/70">
            {weather.description}
          </p>

          <p className="mt-2 text-sm text-white/40">
            H {weather.high}° • L {weather.low}°
          </p>

        </div>

        <WeatherIcon
          icon={weather.icon}
          className="h-20 w-20"
        />

      </div>

    )}

  </GlassPanel>
</WidgetCard>
  );
}