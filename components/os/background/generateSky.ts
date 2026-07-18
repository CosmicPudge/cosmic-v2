import { Universe } from "./Universe";
import type { Sky, Star, StarPopulation, UniverseSettings, Vector2 } from "./types";
import { fractalNoise2D } from "./utils/noise";
import { SeededRandom } from "./utils/seededRandom";

const MAX_POSITION_ATTEMPTS = 48;
const BASE_STAR_DENSITY = 0.08;
const DENSITY_NOISE_OCTAVES = 4;
const DENSITY_NOISE_PERSISTENCE = 0.55;
const DENSITY_NOISE_LACUNARITY = 2;
const SQUARED_EXPONENT = 2;
const FULL_TURN_RADIANS = Math.PI * 2;

interface DensityRegion extends Vector2 {
  radius: number;
  densityMultiplier: number;
}

/**
 * Generates deterministic, world-space star data without any canvas concerns.
 */
export function generateSky(universe: UniverseSettings = Universe): Sky {
  const random = new SeededRandom(universe.seed).fork("sky");
  const clusters = generateDensityRegions(
    random.fork("clusters"),
    universe.sky.clusters.count,
    universe.sky.clusters.minimumRadius,
    universe.sky.clusters.maximumRadius,
    universe.sky.clusters.minimumDensityMultiplier,
    universe.sky.clusters.maximumDensityMultiplier,
    universe.world.radius,
  );
  const voids = generateDensityRegions(
    random.fork("voids"),
    universe.sky.voids.count,
    universe.sky.voids.minimumRadius,
    universe.sky.voids.maximumRadius,
    universe.sky.voids.minimumDensityMultiplier,
    universe.sky.voids.maximumDensityMultiplier,
    universe.world.radius,
  );

  const stars: Star[] = [];
  let starId = 0;

  starId = appendPopulation(
    stars,
    starId,
    "hero",
    universe.sky.stars.heroCount,
    random.fork("hero-stars"),
    clusters,
    voids,
    universe,
  );
  starId = appendPopulation(
    stars,
    starId,
    "bright",
    universe.sky.stars.brightCount,
    random.fork("bright-stars"),
    clusters,
    voids,
    universe,
  );
  starId = appendPopulation(
    stars,
    starId,
    "normal",
    universe.sky.stars.normalCount,
    random.fork("normal-stars"),
    clusters,
    voids,
    universe,
  );
  appendPopulation(
    stars,
    starId,
    "micro",
    universe.sky.stars.microCount,
    random.fork("micro-stars"),
    clusters,
    voids,
    universe,
  );

  return { stars };
}

function appendPopulation(
  stars: Star[],
  startId: number,
  population: StarPopulation,
  count: number,
  random: SeededRandom,
  clusters: readonly DensityRegion[],
  voids: readonly DensityRegion[],
  universe: UniverseSettings,
): number {
  const starConfig = universe.sky.stars;
  const position: Vector2 = { x: 0, y: 0 };

  for (let starIndex = 0; starIndex < count; starIndex += 1) {
    sampleDensityWeightedPosition(
      random,
      clusters,
      voids,
      universe,
      position,
    );

    stars.push({
      id: startId + starIndex,
      population,
      x: position.x,
      y: position.y,
      radius: random.range(
        getPopulationValue(starConfig, population, "RadiusMinimum"),
        getPopulationValue(starConfig, population, "RadiusMaximum"),
      ),
      depth: random.range(
        getPopulationValue(starConfig, population, "DepthMinimum"),
        getPopulationValue(starConfig, population, "DepthMaximum"),
      ),
      color: selectStarColor(random, universe),
      opacity: random.range(
        starConfig.baseOpacityMinimum,
        starConfig.baseOpacityMaximum,
      ),
      twinkleOffset: random.range(0, FULL_TURN_RADIANS),
      twinkleSpeed: random.range(
        starConfig.twinkleSpeedMinimum,
        starConfig.twinkleSpeedMaximum,
      ),
      twinkleStrength: random.range(
        starConfig.twinkleStrengthMinimum,
        starConfig.twinkleStrengthMaximum,
      ),
    });
  }

  return startId + count;
}

function sampleDensityWeightedPosition(
  random: SeededRandom,
  clusters: readonly DensityRegion[],
  voids: readonly DensityRegion[],
  universe: UniverseSettings,
  target: Vector2,
): void {
  const fallbackPosition = { x: 0, y: 0 };

  for (
    let attemptIndex = 0;
    attemptIndex < MAX_POSITION_ATTEMPTS;
    attemptIndex += 1
  ) {
    sampleCircularPosition(random, universe.world.radius, target);

    if (attemptIndex === 0) {
      fallbackPosition.x = target.x;
      fallbackPosition.y = target.y;
    }

    const density = calculateDensity(target, clusters, voids, universe);

    if (random.next() <= density) {
      return;
    }
  }

  target.x = fallbackPosition.x;
  target.y = fallbackPosition.y;
}

function calculateDensity(
  position: Vector2,
  clusters: readonly DensityRegion[],
  voids: readonly DensityRegion[],
  universe: UniverseSettings,
): number {
  const bandConfig = universe.sky.galaxyBand;
  const cosine = Math.cos(bandConfig.rotationRadians);
  const sine = Math.sin(bandConfig.rotationRadians);
  const rotatedY = position.x * sine + position.y * cosine;
  const distanceFromBand = Math.abs(rotatedY - bandConfig.centerOffsetY);
  const bandDistance = distanceFromBand / bandConfig.width;
  const bandDensity =
    Math.exp(-Math.pow(bandDistance, SQUARED_EXPONENT)) *
    bandConfig.densityMultiplier;

  const noiseDensity = fractalNoise2D(
    position.x * bandConfig.noiseScale,
    position.y * bandConfig.noiseScale,
    0,
    DENSITY_NOISE_OCTAVES,
    DENSITY_NOISE_PERSISTENCE,
    DENSITY_NOISE_LACUNARITY,
  );
  const noisyBandDensity =
    bandDensity * (1 + (noiseDensity - 0.5) * bandConfig.noiseStrength);

  let regionMultiplier = 1;

  for (const cluster of clusters) {
    regionMultiplier += calculateRegionInfluence(position, cluster);
  }

  for (const voidRegion of voids) {
    regionMultiplier *=
      1 -
      calculateRegionInfluence(position, voidRegion) *
        (1 - voidRegion.densityMultiplier);
  }

  return Math.min(
    1,
    Math.max(0, (BASE_STAR_DENSITY + noisyBandDensity) * regionMultiplier),
  );
}

function generateDensityRegions(
  random: SeededRandom,
  count: number,
  minimumRadius: number,
  maximumRadius: number,
  minimumDensityMultiplier: number,
  maximumDensityMultiplier: number,
  worldRadius: number,
): DensityRegion[] {
  const regions: DensityRegion[] = [];

  for (let regionIndex = 0; regionIndex < count; regionIndex += 1) {
    const position: Vector2 = { x: 0, y: 0 };
    sampleCircularPosition(random, worldRadius, position);

    regions.push({
      x: position.x,
      y: position.y,
      radius: random.range(minimumRadius, maximumRadius),
      densityMultiplier: random.range(
        minimumDensityMultiplier,
        maximumDensityMultiplier,
      ),
    });
  }

  return regions;
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

function calculateRegionInfluence(
  position: Vector2,
  region: DensityRegion,
): number {
  const deltaX = position.x - region.x;
  const deltaY = position.y - region.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const normalizedDistance = Math.min(1, distance / region.radius);

  return 1 - normalizedDistance * normalizedDistance;
}

function selectStarColor(
  random: SeededRandom,
  universe: UniverseSettings,
): string {
  const colors = universe.sky.colors;
  const weights = colors.colorWeights;
  const selection = random.next();

  let threshold = weights.blueWhite;
  if (selection < threshold) {
    return colors.blueWhite;
  }

  threshold += weights.coolWhite;
  if (selection < threshold) {
    return colors.coolWhite;
  }

  threshold += weights.softWhite;
  if (selection < threshold) {
    return colors.softWhite;
  }

  threshold += weights.warmWhite;
  if (selection < threshold) {
    return colors.warmWhite;
  }

  threshold += weights.amber;
  if (selection < threshold) {
    return colors.amber;
  }

  threshold += weights.paleRose;
  if (selection < threshold) {
    return colors.paleRose;
  }

  return colors.violet;
}

function getPopulationValue(
  config: UniverseSettings["sky"]["stars"],
  population: StarPopulation,
  suffix: "RadiusMinimum" | "RadiusMaximum" | "DepthMinimum" | "DepthMaximum",
): number {
  const populationPrefix =
    population.charAt(0).toUpperCase() + population.slice(1);
  const propertyName = `${populationPrefix}${suffix}` as keyof typeof config;

  return config[propertyName] as number;
}