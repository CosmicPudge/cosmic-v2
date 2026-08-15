"use client";

import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";
import useWeather from "@/hooks/os/useWeather";

export default function AmbientWeather() {
  const { weather, loading, error } = useWeather();

  if (loading) {
    return <p className="text-sm text-white/40">Locating current conditions…</p>;
  }

  if (error || !weather) {
    return <p className="text-sm text-white/40">Weather is unavailable.</p>;
  }

  const isDay = weather.daylightProgress > 0 && weather.daylightProgress < 100;

  return (
    <div className="flex items-center gap-4">
      <WeatherIcon
        condition={mapWeatherCondition(weather.condition)}
        isDay={isDay}
        size={58}
      />
      <div>
        <div className="flex items-baseline gap-3">
          <p className="text-4xl font-light">{Math.round(weather.temp)}°</p>
          <p className="text-sm text-white/55">{weather.condition}</p>
        </div>
        <p className="mt-1 text-xs text-white/38">
          {weather.city} · H {Math.round(weather.high)}° / L {Math.round(weather.low)}°
        </p>
      </div>
    </div>
  );
}
