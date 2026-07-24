"use client";

import { useMemo } from "react";

import type { GalaxyMap } from "./GalaxyMap";
import { GalaxySampler } from "./GalaxySampler";
import { GalaxySeed } from "./GalaxySeed";

interface HeroStarsProps {
  progress?: number;
  galaxy: GalaxyMap;
}

interface HeroStar {
  x: number;
  y: number;
  size: number;
  glow: number;
  opacity: number;
  duration: number;
  spikeLength: number;
  spikeOpacity: number;
  color: string;
}

const HERO_COUNT = 24;

export default function HeroStars({
  progress = 1,
  galaxy,
}: HeroStarsProps) {
  const stars = useMemo(() => {
    const rng = new GalaxySeed(97531246);
    const sampler = new GalaxySampler(galaxy);

    const colors = [
      "#FFFFFF",
      "#F8FBFF",
      "#EAF3FF",
      "#FFF7E5",
    ] as const;

    const generated: HeroStar[] = [];

    while (generated.length < HERO_COUNT) {
      const nx = rng.random();
      const ny = rng.random();

      const density = sampler.density(nx, ny);

      // Hero stars should be fairly rare.
      if (!rng.chance(Math.pow(density, 3))) {
        continue;
      }

      const size = rng.range(0.35, 0.75);

      generated.push({
        x: nx * 100,
        y: ny * 100,

        size,

        glow: size * rng.range(1.6, 2.2),

        opacity: rng.range(0.75, 0.95),

        duration: rng.range(12, 26),

        spikeLength: size * rng.range(1.4, 2.0),

        spikeOpacity: rng.range(0.12, 0.22),

        color:
          colors[
            Math.floor(
              rng.random() * colors.length
            )
          ],
      });
    }

    return generated;
  }, [galaxy]);

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity: progress }}
    >
      <defs>
        <filter
          id="heroGlow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur
            stdDeviation="0.35"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {stars.map((star, i) => (
        <g
          key={i}
          filter="url(#heroGlow)"
        >
          {/* Soft glow */}
          <circle
            cx={star.x}
            cy={star.y}
            r={star.glow}
            fill={star.color}
            opacity={0.025}
          />

          {/* Only some stars get diffraction spikes */}
          {i % 3 === 0 && (
            <>
              <line
                x1={star.x}
                y1={star.y - star.spikeLength}
                x2={star.x}
                y2={star.y + star.spikeLength}
                stroke={star.color}
                strokeWidth={0.05}
                opacity={star.spikeOpacity}
              />

              <line
                x1={star.x - star.spikeLength}
                y1={star.y}
                x2={star.x + star.spikeLength}
                y2={star.y}
                stroke={star.color}
                strokeWidth={0.05}
                opacity={star.spikeOpacity}
              />
            </>
          )}

          {/* Star core */}
          <circle
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill={star.color}
            opacity={star.opacity}
          >
            <animate
              attributeName="opacity"
              values={`${star.opacity};${Math.min(
                1,
                star.opacity + 0.08
              )};${star.opacity}`}
              dur={`${star.duration}s`}
              repeatCount="indefinite"
            />

            <animate
              attributeName="r"
              values={`${star.size};${star.size + 0.04};${star.size}`}
              dur={`${star.duration}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}