"use client";

import useWeather from "@/hooks/os/useWeather";

import SkyLayer from "./layers/SkyLayer";
import AtmosphereLayer from "./layers/AtmosphereLayer";
import StarsLayer from "./layers/StarsLayer";
import CloudLayer from "./layers/CloudLayer";
import SunMoonLayer from "./layers/SunMoonLayer";
import RainLayer from "./layers/RainLayer";
import SnowLayer from "./layers/SnowLayer";
import FogLayer from "./layers/FogLayer";
import AmbientLightLayer from "./layers/AmbientLightLayer";
import LightningLayer from "./layers/LightningLayer";

export default function AnimatedBackground() {
  const { weather } = useWeather();

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">

      <SkyLayer weather={weather} />

<AtmosphereLayer weather={weather} />

<AmbientLightLayer weather={weather} />

<SunMoonLayer weather={weather} />

<CloudLayer weather={weather} />

<StarsLayer weather={weather} />

<RainLayer weather={weather} />

<SnowLayer weather={weather} />

<FogLayer weather={weather} />

<LightningLayer weather={weather} />

    </div>
  );
}