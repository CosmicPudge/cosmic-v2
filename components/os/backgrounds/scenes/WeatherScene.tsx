"use client";

import type { WeatherData } from "@/engines/environment";

import GradientLayer from "../effects/GradientLayer";
import CloudLayer from "../effects/CloudLayer";
import LightRaysLayer from "../effects/LightRaysLayer";
import ParticlesLayer from "../effects/ParticlesLayer";

interface Props {
  context?: WeatherData;
}

export default function WeatherScene({
  context,
}: Props) {
  const weather = context;

  const condition =
    weather?.condition?.toLowerCase() ?? "clear";

  // Use real sunrise/sunset if available
  const now = Math.floor(Date.now() / 1000);

  const isNight =
    weather?.sunrise && weather?.sunset
      ? now < weather.sunrise || now > weather.sunset
      : (() => {
          const hour = new Date().getHours();
          return hour >= 20 || hour <= 5;
        })();

  const isStorm =
    condition.includes("thunder");

  const isRain =
    condition.includes("rain") ||
    condition.includes("drizzle");

  const isSnow =
    condition.includes("snow");

  const isCloudy =
    condition.includes("cloud") ||
    condition.includes("mist") ||
    condition.includes("fog") ||
    condition.includes("haze") ||
    condition.includes("smoke");

  const isClear =
    condition.includes("clear") ||
    condition.includes("sun");

  // Determine background gradient
  let gradient:
    | "sunny"
    | "cloudy"
    | "rain"
    | "storm"
    | "snow"
    | "night";

  if (isNight) {
    gradient = "night";
  } else if (isStorm) {
    gradient = "storm";
  } else if (isRain) {
    gradient = "rain";
  } else if (isSnow) {
    gradient = "snow";
  } else if (isCloudy) {
    gradient = "cloudy";
  } else {
    gradient = "sunny";
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Background Sky */}
      <GradientLayer variant={gradient} />

      {/* Sun Rays */}
      {!isNight && !isStorm && !isRain && (
        <LightRaysLayer
          opacity={isCloudy ? 0.08 : 0.18}
        />
      )}

      {/* Clouds */}
      {(isCloudy || isRain || isStorm || isSnow) && (
        <CloudLayer />
      )}

      {/* Atmospheric Particles */}
      <ParticlesLayer
        count={isNight ? 35 : 70}
        size={2}
        opacity={isNight ? 0.12 : 0.22}
      />

      {/* Coming Soon */}
      {/* RainLayer */}
      {/* SnowLayer */}
      {/* StarsLayer */}
      {/* FogLayer */}
      {/* SkyGlowLayer */}
      {/* SunLayer */}

    </div>
  );
}