"use client";

import { useMemo } from "react";

import { generateGalaxyMap } from "./GalaxyMap";
import { DefaultGalaxyConfig } from "./GalaxyConfig";

import BackgroundNebula from "./BackgroundNebula";
import GalaxyClouds from "./GalaxyClouds";
import HeroStars from "./HeroStars";
import MilkyWay from "./MilkyWay";
import StarDust from "./StarDust";
import StarField from "./StarField";

import { usePerformance } from "../performance";

interface GalaxyEngineProps {
  progress?: number;
}

export default function GalaxyEngine({
  progress = 1,
}: GalaxyEngineProps) {
  const { profile } = usePerformance();

  const galaxy = useMemo(
    () =>
      generateGalaxyMap({
        ...DefaultGalaxyConfig,
        quality: profile.galaxyQuality,
      }),
    [profile.galaxyQuality]
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Atmospheric haze */}
      <div
        className="absolute inset-0"
        style={{
          opacity: progress * 0.25,
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.02), transparent 75%)",
        }}
      />

      {/* Nebula */}
      <BackgroundNebula
        galaxy={galaxy}
        progress={progress}
      />

      {/* Galaxy clouds */}
      <GalaxyClouds
        galaxy={galaxy}
        progress={progress}
      />

      {/* Background dust */}
      <StarDust
        galaxy={galaxy}
        progress={progress}
      />

      {/* Milky Way */}
      <MilkyWay
        galaxy={galaxy}
        progress={progress}
      />

      {/* Main stars */}
      <StarField
        galaxy={galaxy}
        progress={progress}
        depth="background"
      />

      <StarField
        galaxy={galaxy}
        progress={progress}
        depth="mid"
      />

      <StarField
        galaxy={galaxy}
        progress={progress}
        depth="foreground"
      />

      {/* Hero stars */}
      <HeroStars
        galaxy={galaxy}
        progress={progress}
      />
    </div>
  );
}