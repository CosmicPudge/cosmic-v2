"use client";

import { useMemo } from "react";

import type { GalaxyMap } from "./GalaxyMap";
import { GalaxySampler } from "./GalaxySampler";
import { GalaxySeed } from "./GalaxySeed";

interface StarDustProps {
  progress?: number;
  galaxy: GalaxyMap;
}

interface DustStar {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

const STAR_COUNT = 18000;

export default function StarDust({
  progress = 1,
  galaxy,
}: StarDustProps) {
  const stars = useMemo(() => {
    const rng = new GalaxySeed(8675309);
    const sampler = new GalaxySampler(galaxy);

    const generated: DustStar[] = [];

    while (generated.length < STAR_COUNT) {
      const nx = rng.random();
      const ny = rng.random();

      const density = sampler.density(nx, ny);

      // Bias dust toward denser regions while leaving empty space.
      if (!rng.chance(density * 0.75)) {
        continue;
      }

      generated.push({
        x: nx * 100,
        y: ny * 100,

        // Tiny stars only.
        r: rng.range(0.015, 0.08),

        // Very subtle opacity.
        opacity: rng.range(0.015, 0.06),
      });
    }

    return generated;
  }, [galaxy]);

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        opacity: progress * 0.9,
      }}
    >
      {stars.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="white"
          opacity={star.opacity}
        />
      ))}
    </svg>
  );
}