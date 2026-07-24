"use client";

import BackgroundGradient from "./BackgroundGradient";
import BackgroundGlow from "./BackgroundGlow";
import GalaxyEngine from "./GalaxyEngine";
import BackgroundNoise from "./BackgroundNoise";
import BackgroundVignette from "./BackgroundVignette";

interface UniverseBackgroundProps {
  progress?: number;
}

export default function UniverseBackground({
  progress = 1,
}: UniverseBackgroundProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Deep space color */}
      <BackgroundGradient progress={progress} />

      {/* Soft ambient glow */}
      <BackgroundGlow progress={progress} />

      {/* Complete galaxy renderer */}
      <GalaxyEngine progress={progress} />

      {/* Film grain */}
      <BackgroundNoise progress={progress} />

      {/* Edge darkening */}
      <BackgroundVignette progress={progress} />
    </div>
  );
}