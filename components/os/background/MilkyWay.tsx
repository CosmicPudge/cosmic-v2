"use client";

import { useMemo } from "react";

import type { GalaxyMap } from "./GalaxyMap";
import { GalaxySampler } from "./GalaxySampler";

interface MilkyWayProps {
  progress?: number;
  galaxy: GalaxyMap;
}

interface BandSlice {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

const LAYERS = [
  { offset: 0.00, blur: 8, opacity: 0.030 },
  { offset: 0.02, blur: 5, opacity: 0.020 },
  { offset: -0.02, blur: 5, opacity: 0.020 },
  { offset: 0.05, blur: 3, opacity: 0.012 },
];

const SEGMENTS = 220;

export default function MilkyWay({
  progress = 1,
  galaxy,
}: MilkyWayProps) {
  const sampler = useMemo(
    () => new GalaxySampler(galaxy),
    [galaxy]
  );

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        opacity: progress * 0.65,
      }}
    >
      <defs>
        {LAYERS.map((layer, i) => (
          <filter
            key={i}
            id={`milkyGlow${i}`}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation={layer.blur} />
          </filter>
        ))}
      </defs>

      {LAYERS.map((layer, layerIndex) => (
        <g
          key={layerIndex}
          filter={`url(#milkyGlow${layerIndex})`}
        >
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const nx = i / (SEGMENTS - 1);

            const baseY =
              0.50 +
              Math.sin(nx * Math.PI * 2) * 0.07 +
              Math.sin(nx * Math.PI * 6) * 0.015 +
              layer.offset;

            const density = sampler.density(nx, baseY);

            const radius =
              2.5 +
              density * 4;

            const opacity =
              density *
              layer.opacity;

            return (
              <circle
                key={i}
                cx={nx * 100}
                cy={baseY * 100}
                r={radius}
                fill="white"
                opacity={opacity}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}