"use client";

import { useMemo } from "react";

import { Colors } from "@/design-system/tokens/colors";
import { generateStars } from "../data/generateStars";

interface Props {
  density?: "sparse" | "normal" | "dense";
  opacity?: number;
  twinkle?: boolean;
}

export default function Stars({
  density = "normal",
  opacity = 1,
  twinkle = true,
}: Props) {
  const stars = useMemo(
    () =>
      generateStars({
        density,
        seed: "clear-night",
      }),
    [density]
  );

  return (
    <>
      {stars.map((star, index) => (
        <g
          key={index}
          className={twinkle ? "cosmic-star" : ""}
          style={{
  opacity: star.opacity * opacity,
  animationDelay: `-${star.phase}s`,
  animationDuration: `${star.speed}s`,
}}
        >
          {/* Glow */}
          <circle
            cx={star.x}
            cy={star.y}
            r={star.glowRadius}
            fill={Colors.weather.moonGlow}
            opacity={0.18}
          />

          {/* Core */}
          <circle
            cx={star.x}
            cy={star.y}
            r={star.radius}
            fill={Colors.weather.moonLight}
          />
        </g>
      ))}
    </>
  );
}