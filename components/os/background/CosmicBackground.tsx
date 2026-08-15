"use client";

import type { PropsWithChildren } from "react";

import BackgroundCanvas from "./BackgroundCanvas";
import type {
  CosmicBackgroundIntensity,
  CosmicBackgroundMotion,
  CosmicBackgroundVariant,
} from "./CanvasRenderer";

interface CosmicBackgroundProps extends PropsWithChildren {
  variant?: CosmicBackgroundVariant;
  intensity?: CosmicBackgroundIntensity;
  motion?: CosmicBackgroundMotion;
  timeOverrideSeconds?: number;
  debug?: boolean;
  reducedMotion?: boolean;
}

export default function CosmicBackground({
  children,
  variant = "dashboard",
  intensity = "normal",
  motion = "normal",
  timeOverrideSeconds,
  debug = false,
  reducedMotion = false,
}: CosmicBackgroundProps) {
  const overlayOpacity = variant === "ambient" ? "bg-black/10" : "bg-black/35";

  return (
    <>
      <div
        className="absolute inset-0 z-0 overflow-hidden bg-[#030511] pointer-events-none select-none"
        aria-hidden="true"
      >
        <BackgroundCanvas
          variant={variant}
          intensity={intensity}
          motion={motion}
          timeOverrideSeconds={timeOverrideSeconds}
          debug={debug}
          reducedMotion={reducedMotion}
        />
        <div className={`absolute inset-0 ${overlayOpacity}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_20%,rgba(0,0,0,0.54)_100%)]" />
      </div>

      {children ? <div className="relative z-10">{children}</div> : null}
    </>
  );
}
