import { Universe } from "./Universe";
import type { Nebula, NebulaWisp, UniverseSettings, Vector2 } from "./types";
import { fractalNoise2D } from "./utils/noise";
import { SeededRandom } from "./utils/seededRandom";

const MAX_POSITION_ATTEMPTS = 48;
const FULL_TURN_RADIANS = Math.PI * 2;
const DENSITY_NOISE_OCTAVES = 3;
const DENSITY_NOISE_PERSISTENCE = 0.58;
const DENSITY_NOISE_LACUNARITY = 2;
const BASE_NEBULA_DENSITY = 0.12;
const SQUARED_EXPONENT = 2;

/**
 * Generates layered interstellar-gas wisps in world space.
 * This module only produces data; it does not perform canvas rendering.
 */
export function generateNebula(
  universe: UniverseSettings = Universe,
): Nebula {
  const random = new SeededRandom(universe.seed).fork("nebula");
  const wisps: NebulaWisp[] = [];
  let wispId = 0;

  for (
    let layerIndex = 0;
    layerIndex < universe.nebula.layerCount;
    layerIndex += 1
  ) {
    const layerRandom = random.fork(`layer-${layerIndex}`);
    const layerProgress =
      universe.nebula.layerCount > 1
        ? layerIndex / (universe.nebula.layerCount - 1)
        : 0;

    for (
      let wispIndex = 0;
      wispIndex < universe.nebula.wispsPerLayer;
      wispIndex += 1
    ) {
      const position: Vector2 = { x: 0, y: 0 };
      sampleNebulaPosition(layerRandom, universe, position);

      const depth = interpolate(
        universe.nebula.depthMinimum,
        universe.nebula.depthMaximum,
        layerProgress,
      );

      wisps.push({
        id: wispId,
        layer: layerIndex,
        x: position.x,
        y: position.y,
        depth: depth + layerRandom.range(0, universe.nebula.depthMaximum - depth),
        radius: layerRandom.range(
          universe.nebula.wispRadiusMinimum,
          universe.nebula.wispRadiusMaximum,
        ),
        rotation: layerRandom.range(
          universe.nebula.rotationMinimum,
          universe.nebula.rotationMaximum,
        ),
        stretch: layerRandom.range(
          universe.nebula.stretchMinimum,
          universe.nebula.stretchMaximum,
        ),
        opacity: layerRandom.range(
          universe.nebula.wispOpacityMinimum,
          universe.nebula.wispOpacityMaximum,
        ),
        blur: layerRandom.range(
          universe.nebula.wispBlurMinimum,
          universe.nebula.wispBlurMaximum,
        ),
        color: layerRandom.pick(universe.nebula.colors),
      });

      wispId += 1;
    }
  }

  return { wisps };
}

function sampleNebulaPosition(
  random: SeededRandom,
  universe: UniverseSettings,
  target: Vector2,
): void {
  for (
    let attemptIndex = 0;
    attemptIndex < MAX_POSITION_ATTEMPTS;
    attemptIndex += 1
  ) {
    sampleCircularPosition(random, universe.nebula.distributionRadius, target);

    if (random.next() <= calculateNebulaDensity(target, universe)) {
      return;
    }
  }
}

function calculateNebulaDensity(
  position: Vector2,
  universe: UniverseSettings,
): number {
  const bandConfig = universe.sky.galaxyBand;
  const cosine = Math.cos(bandConfig.rotationRadians);
  const sine = Math.sin(bandConfig.rotationRadians);
  const rotatedY = position.x * sine + position.y * cosine;
  const bandDistance = Math.abs(rotatedY - bandConfig.centerOffsetY);
  const normalizedBandDistance = bandDistance / bandConfig.width;
  const bandDensity =
    Math.exp(-Math.pow(normalizedBandDistance, SQUARED_EXPONENT)) *
    universe.nebula.bandDensityMultiplier;

  const noiseDensity = fractalNoise2D(
    position.x * universe.nebula.noiseScale,
    position.y * universe.nebula.noiseScale,
    1,
    DENSITY_NOISE_OCTAVES,
    DENSITY_NOISE_PERSISTENCE,
    DENSITY_NOISE_LACUNARITY,
  );

  const noisyDensity =
    BASE_NEBULA_DENSITY +
    bandDensity *
      (1 + (noiseDensity - 0.5) * universe.nebula.noiseStrength);

  return Math.min(1, Math.max(0, noisyDensity));
}

function sampleCircularPosition(
  random: SeededRandom,
  radius: number,
  target: Vector2,
): void {
  const angle = random.range(0, FULL_TURN_RADIANS);
  const radialDistance = Math.sqrt(random.next()) * radius;

  target.x = Math.cos(angle) * radialDistance;
  target.y = Math.sin(angle) * radialDistance;
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}