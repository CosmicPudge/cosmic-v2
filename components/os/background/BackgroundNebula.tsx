"use client";

import { useMemo } from "react";

import type { GalaxyMap } from "./GalaxyMap";
import { GalaxySampler } from "./GalaxySampler";

interface BackgroundNebulaProps {
  progress?: number;
  galaxy: GalaxyMap;
}

interface Cloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
}

const CLOUDS = 90;

export default function BackgroundNebula({
  progress = 1,
  galaxy,
}: BackgroundNebulaProps) {
  const clouds = useMemo(() => {
    const sampler = new GalaxySampler(galaxy);

    const generated: Cloud[] = [];

    for (let gy = 0; gy < galaxy.height; gy++) {
      for (let gx = 0; gx < galaxy.width; gx++) {
        const nx = gx / galaxy.width;
        const ny = gy / galaxy.height;

        const nebula = sampler.nebula(nx, ny);

        if (nebula < 0.72) continue;

        let color = "#3b82f6";

        if (nebula > 0.90) color = "#8b5cf6";
        else if (nebula > 0.82) color = "#6366f1";
        else if (nebula > 0.76) color = "#60a5fa";

        generated.push({
          x: nx * 100,
          y: ny * 100,

          radius: 3 + nebula * 5,

          opacity:
            (nebula - 0.72) *
            0.045,

          color,
        });

        if (generated.length >= CLOUDS)
          return generated;
      }
    }

    return generated;
  }, [galaxy]);

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        opacity: progress * 0.45,
      }}
    >
      <defs>
        <filter
          id="nebulaBlur"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {clouds.map((cloud, i) => (
        <circle
          key={i}
          cx={cloud.x}
          cy={cloud.y}
          r={cloud.radius}
          fill={cloud.color}
          opacity={cloud.opacity}
          filter="url(#nebulaBlur)"
        />
      ))}
    </svg>
  );
}