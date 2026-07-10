"use client";

import ClearDay from "./ClearDay";
import ClearNight from "./ClearNight";
import type { WeatherCondition } from "./types";

import PartlyCloudyDay from "./PartlyCloudyDay";
import PartlyCloudyNight from "./PartlyCloudyNight";
import Cloudy from "./Cloudy";
import Rain from "./Rain";
import Snow from "./Snow";
import Thunderstorm from "./Thunderstorm";
import Wind from "./Wind";
import type { WeatherIconOptions } from "./options";

// Future Icons
import Fog from "./Fog";
import Tornado from "./Tornado";
import Hurricane from "./Hurricane";


interface Props {
  condition: WeatherCondition;
  isDay: boolean;
  size?: number;

  animation?:
    | "off"
    | "subtle"
    | "normal"
    | "dynamic";

  options?: WeatherIconOptions;

  className?: string;
}

export default function WeatherIcon({
  condition,
  isDay,
  size = 48,
  options,
}: Props) {
  switch (condition) {
    case "clear":
      return isDay ? (
        <ClearDay size={size} />
      ) : (
        <ClearNight
  size={size}
  starDensity={options?.starDensity}
/>
      );

    case "partly-cloudy":
      return isDay ? (
        <PartlyCloudyDay size={size} />
      ) : (
        <PartlyCloudyNight size={size} />
      );

    case "cloudy":
  return <Cloudy size={size} />;

    case "rain":
      return <Rain size={size} />;

    case "showers":
      return <Rain size={size} />;

    case "snow":
      return <Snow size={size} />;

    case "blizzard":
      return <Snow size={size} />;

    case "thunderstorm":
      return <Thunderstorm size={size} />;

    case "thunder-rain":
      return <Thunderstorm size={size} />;

    case "wind":
      return <Wind size={size} />;

    case "fog":
      return <Fog size={size} />;

    case "tornado":
      return <Tornado size={size} />;

    case "hurricane":
      return <Hurricane size={size} />;

    default:
      return isDay ? (
        <ClearDay size={size} />
      ) : (
        <ClearNight size={size} />
      );
  }
}