"use client";

import { useMemo } from "react";

import { usePerformance } from "../performance";

import type { GalaxyMap } from "./GalaxyMap";
import { GalaxySampler } from "./GalaxySampler";
import { GalaxySeed } from "./GalaxySeed";

interface StarFieldProps {
  progress?: number;
  galaxy: GalaxyMap;
  depth?: "background" | "mid" | "foreground";
}

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  color: string;
  twinkle: number;
}

export default function StarField({
  progress = 1,
  galaxy,
  depth = "mid",
}: StarFieldProps) {
  const { profile } = usePerformance();

  const totalStars = profile.starCount;

  const layerConfig = useMemo(() => {
    switch (depth) {
      case "background":
        return {
          count: Math.round(totalStars * 0.62),
          exposure: 0.35,
          scale: 0.6,
        };

      case "foreground":
        return {
          count: Math.round(totalStars * 0.06),
          exposure: 1,
          scale: 1.5,
        };

      default:
        return {
          count: Math.round(totalStars * 0.32),
          exposure: 0.65,
          scale: 1,
        };
    }
  }, [depth, totalStars]);

  const stars = useMemo(() => {
    const rng = new GalaxySeed(
      depth === "background"
        ? 123456
        : depth === "mid"
        ? 24681357
        : 987654
    );

    const sampler = new GalaxySampler(galaxy);

    const generated: Star[] = [];

    while (generated.length < layerConfig.count) {
      const nx = rng.random();
      const ny = rng.random();

      const arm = sampler.arm(nx, ny);
      const core = sampler.core(nx, ny);
      const halo = sampler.halo(nx, ny);
      const dust = sampler.dust(nx, ny);

      let probability =
        core * 0.95 +
        arm * 0.70 +
        halo * 0.18 -
        dust * 0.55;

      probability = Math.max(
        0,
        Math.min(1, probability)
      );

      if (!rng.chance(probability)) {
        continue;
      }

      const brightness = rng.random();

      const baseRadius =
        brightness > 0.997
          ? 0.90
          : brightness > 0.992
          ? 0.70
          : brightness > 0.975
          ? 0.45
          : brightness > 0.93
          ? 0.28
          : 0.12;

      const radius =
        baseRadius *
        layerConfig.scale *
        (1 +
          core * 0.45 +
          arm * 0.10 -
          halo * 0.15);

      let color: string;

      const roll = rng.random();

      if (core > 0.65) {
        color =
          roll < 0.55
            ? "#FFF4D8"
            : roll < 0.85
            ? "#FFFFFF"
            : "#F8FBFF";
      } else if (arm > 0.45) {
        color =
          roll < 0.70
            ? "#FFFFFF"
            : roll < 0.90
            ? "#F8FBFF"
            : "#FFF7E6";
      } else {
        color =
          roll < 0.60
            ? "#DCEEFF"
            : "#F8FBFF";
      }

      const opacity =
        (
          0.15 +
          brightness * 0.40 +
          core * 0.30 +
          arm * 0.12 -
          dust * 0.08
        ) * layerConfig.exposure;

      generated.push({
        x: nx * 100,
        y: ny * 100,
        r: radius,
        opacity,
        color,
        twinkle: rng.range(6, 16),
      });

      if (
        arm > 0.70 &&
        rng.random() < 0.08
      ) {
        const companions = Math.floor(
          rng.range(2, 5)
        );

        for (
          let i = 0;
          i < companions;
          i++
        ) {
          generated.push({
            x:
              (nx +
                rng.range(
                  -0.003,
                  0.003
                )) *
              100,

            y:
              (ny +
                rng.range(
                  -0.003,
                  0.003
                )) *
              100,

            r:
              baseRadius *
              0.45 *
              layerConfig.scale,

            opacity:
              0.18 +
              rng.random() * 0.25,

            color,

            twinkle: rng.range(
              8,
              18
            ),
          });
        }
      }
    }

    return generated;
  }, [
    galaxy,
    depth,
    layerConfig,
  ]);

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        opacity: progress,
      }}
    >
      <defs>
        <filter
          id="starGlow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation="0.12"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {stars.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill={star.color}
          opacity={star.opacity}
          filter="url(#starGlow)"
        >
          <animate
            attributeName="opacity"
            values={`${star.opacity};${Math.min(
              1,
              star.opacity + 0.08
            )};${star.opacity}`}
            dur={`${star.twinkle}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}