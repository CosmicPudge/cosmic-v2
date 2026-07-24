"use client";

import { useMemo } from "react";

import { usePerformance } from "../performance";

import {
  GalaxySampler,
} from "./GalaxySampler";

import {
  GalaxyNoise,
} from "./GalaxyNoise";

import {
  getQualitySettings,
} from "./GalaxyConfig";

import type {
  GalaxyMap,
} from "./GalaxyMap";

interface GalaxyCloudsProps {
  galaxy: GalaxyMap;
  progress?: number;
}

interface Cloud {
  x: number;
  y: number;

  r: number;

  opacity: number;

  color: string;
}

export default function GalaxyClouds({
  galaxy,
  progress = 1,
}: GalaxyCloudsProps) {
  const { profile } = usePerformance();

  const clouds = useMemo(() => {
    const sampler = new GalaxySampler(galaxy);

    const noise = new GalaxyNoise(8675309);

    const quality = getQualitySettings(
      profile.galaxyQuality
    );

    const grid = quality.cloudGrid;

    const generated: Cloud[] = [];

    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const nx = x / (grid - 1);
        const ny = y / (grid - 1);

        const arm = sampler.arm(nx, ny);

        const halo = sampler.halo(nx, ny);

        const core = sampler.core(nx, ny);

        const dust = sampler.dust(nx, ny);

        const density = noise.sample(
          nx,
          ny,
          {
            scale: 4,
            octaves: quality.octaves,
          }
        );

        const strength =
          arm *
          halo *
          density *
          (1 - dust * 0.5);

        if (strength < 0.18) {
          continue;
        }

        const radius =
          0.5 +
          strength * 2.5;

        const roll = noise.sample(
          nx + 100,
          ny + 100,
          {
            scale: 6,
            octaves: 2,
          }
        );

        let color = "#6ea8ff";

        if (roll > 0.75) {
          color = "#b26cff";
        } else if (roll > 0.45) {
          color = "#7fd3ff";
        } else if (core > 0.6) {
          color = "#ffe4b3";
        }

        generated.push({
          x: nx * 100,
          y: ny * 100,
          r: radius,
          opacity: strength * 0.08,
          color,
        });
      }
    }

    return generated;
  }, [
    galaxy,
    profile.galaxyQuality,
  ]);

  return (
    <svg
      className="absolute inset-0 w-full h-full animate-galaxy-clouds"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        opacity: progress,
        mixBlendMode: "screen",
      }}
    >
      <defs>
        <filter
          id="cloudBlur"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {clouds.map((cloud, index) => (
        <circle
          key={index}
          cx={cloud.x}
          cy={cloud.y}
          r={cloud.r}
          fill={cloud.color}
          opacity={cloud.opacity}
          filter="url(#cloudBlur)"
        />
      ))}
    </svg>
  );
}