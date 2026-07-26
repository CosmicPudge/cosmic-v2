"use client";

import WeatherIcon from "./WeatherIcon";
import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData;
  size?: number;
  className?: string;
}

const CONDITION_MAP: Record<string, any> = {
  Clear: "clear",
  Clouds: "cloudy",
  Rain: "rain",
  Drizzle: "showers",
  Thunderstorm: "thunderstorm",
  Snow: "snow",
  Mist: "fog",
  Smoke: "fog",
  Haze: "fog",
  Dust: "fog",
  Fog: "fog",
  Sand: "fog",
  Ash: "fog",
  Squall: "wind",
  Tornado: "tornado",
};

export default function WeatherIconAdapter({
  weather,
  size = 120,
  className,
}: Props) {
  const now = Date.now() / 1000;

  const isDay =
    now >= weather.sunrise &&
    now < weather.sunset;

  const condition =
    CONDITION_MAP[weather.condition] ??
    weather.icon ??
    "clear";

  return (
    <div className={className}>
      <WeatherIcon
        condition={condition}
        isDay={isDay}
        size={size}
        animation="dynamic"
        options={{
          starDensity: "dense",
        }}
      />
    </div>
  );
}