export type GalaxyQuality =
  | "low"
  | "medium"
  | "high"
  | "ultra";

export interface GalaxyConfig {
  seed: number;

  width: number;
  height: number;

  centerX: number;
  centerY: number;

  arms: number;
  armWidth: number;
  armTightness: number;

  coreRadius: number;
  coreStrength: number;

  haloRadius: number;
  haloStrength: number;

  dustStrength: number;
  nebulaStrength: number;

  densityMultiplier: number;

  quality: GalaxyQuality;
}

const QUALITY = {
  low: {
    map: 96,
    octaves: 2,
    cloudGrid: 48,
    stars: 2000,
  },

  medium: {
    map: 128,
    octaves: 3,
    cloudGrid: 64,
    stars: 4500,
  },

  high: {
    map: 160,
    octaves: 4,
    cloudGrid: 80,
    stars: 7000,
  },

  ultra: {
    map: 224,
    octaves: 5,
    cloudGrid: 120,
    stars: 12000,
  },
} as const;

export function getQualitySettings(
  quality: GalaxyQuality
) {
  return QUALITY[quality];
}

export const DefaultGalaxyConfig: GalaxyConfig = {
  seed: 8675309,

  quality: "medium",

  width: QUALITY.medium.map,
  height: QUALITY.medium.map,

  centerX: 0.5,
  centerY: 0.5,

  arms: 4,
  armWidth: 0.24,
  armTightness: 3.1,

  coreRadius: 0.17,
  coreStrength: 1,

  haloRadius: 0.62,
  haloStrength: 0.55,

  dustStrength: 0.7,
  nebulaStrength: 0.55,

  densityMultiplier: 1,
};