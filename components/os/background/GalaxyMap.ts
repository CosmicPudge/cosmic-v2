import {
  DefaultGalaxyConfig,
  getQualitySettings,
  type GalaxyConfig,
} from "./GalaxyConfig";

import { GalaxyNoise } from "./GalaxyNoise";

export interface GalaxyCell {
  x: number;
  y: number;

  density: number;
  galaxy: number;
  nebula: number;

  armStrength: number;
  coreStrength: number;
  haloStrength: number;
  dust: number;
}

export interface GalaxyMap {
  width: number;
  height: number;
  cells: GalaxyCell[];
}

export function generateGalaxyMap(
  config: GalaxyConfig = DefaultGalaxyConfig
): GalaxyMap {
  const quality = getQualitySettings(config.quality);

  const noise = new GalaxyNoise(config.seed);

  const {
    width,
    height,

    centerX,
    centerY,

    arms,
    armWidth,
    armTightness,

    coreRadius,
    coreStrength,

    haloRadius,
    haloStrength,

    dustStrength,
    nebulaStrength,

    densityMultiplier,
  } = config;

  const cells: GalaxyCell[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / (width - 1);
      const ny = y / (height - 1);

      //--------------------------------------
      // Polar Coordinates
      //--------------------------------------

      const dx = nx - centerX;
      const dy = ny - centerY;

      const radius = Math.sqrt(dx * dx + dy * dy);

      let angle = Math.atan2(dy, dx);

      if (angle < 0) {
        angle += Math.PI * 2;
      }

      //--------------------------------------
      // Core
      //--------------------------------------

      const core =
        Math.exp(
          -(radius * radius) /
            (coreRadius * coreRadius)
        ) * coreStrength;

      //--------------------------------------
      // Halo
      //--------------------------------------

      const halo =
        Math.exp(
          -(radius * radius) /
            (haloRadius * haloRadius)
        ) * haloStrength;

      //--------------------------------------
      // Spiral Arms
      //--------------------------------------

      let arm = 0;

      if (arms > 0) {
        const armSpread =
          armWidth *
          (0.6 + radius * 1.5);

        const wobble =
          noise.sample(nx * 3, ny * 3, {
            scale: 5,
            octaves: Math.max(1, quality.octaves - 2),
          }) * 0.14;

        const spiral =
          angle +
          wobble -
          radius *
            armTightness *
            Math.PI;

        const sector =
          ((spiral * arms) %
            (Math.PI * 2) +
            Math.PI * 2) %
          (Math.PI * 2);

        const d = Math.min(
          sector,
          Math.PI * 2 - sector
        );

        arm = Math.exp(
          -(d * d) /
            (armSpread * armSpread)
        );

        arm *=
          0.75 +
          0.25 *
            noise.sample(nx * 4, ny * 4, {
              scale: 8,
              octaves: Math.max(1, quality.octaves - 1),
            });

        arm *= Math.exp(-radius * 1.25);

        arm = Math.min(
          1,
          Math.max(0, arm)
        );
      }

      //--------------------------------------
      // Dust Noise
      //--------------------------------------

      const dustNoise = noise.sample(nx, ny, {
        scale: 9,
        octaves: quality.octaves,
      });

      const dust =
        arm *
        dustNoise *
        (1 - core) *
        dustStrength;

      //--------------------------------------
      // Nebula Noise
      //--------------------------------------

      const nebulaNoise = noise.sample(
        nx + 200,
        ny + 200,
        {
          scale: 3,
          octaves: Math.max(2, quality.octaves - 1),
        }
      );

      const nebula =
        arm *
        halo *
        nebulaNoise *
        nebulaStrength;

      //--------------------------------------
      // Star Formation Noise
      //--------------------------------------

      const formation = noise.sample(
        nx + 100,
        ny + 100,
        {
          scale: 14,
          octaves: Math.max(2, quality.octaves - 1),
        }
      );

      //--------------------------------------
      // Galaxy Brightness
      //--------------------------------------

      const galaxy = Math.min(
        1,
        core +
          arm * 0.7 +
          halo * 0.35
      );

      //--------------------------------------
      // Density
      //--------------------------------------

      const density = Math.min(
        1,
        (
          core +
          arm * 0.8 +
          halo * 0.2
        ) *
          formation *
          densityMultiplier *
          (1 - dust * 0.25)
      );

      cells.push({
        x: nx,
        y: ny,

        density,
        galaxy,
        nebula,

        armStrength: arm,
        coreStrength: core,
        haloStrength: halo,
        dust,
      });
    }
  }

  return {
    width,
    height,
    cells,
  };
}