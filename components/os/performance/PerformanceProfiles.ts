import type { GalaxyQuality } from "../background/GalaxyConfig";

/**
 * Cosmic Adaptive Rendering
 * -------------------------
 * These are render budgets, not graphics presets.
 *
 * The renderer automatically moves between these
 * based on hardware and (later) live FPS.
 */

export interface PerformanceProfile {
  /**
   * Internal profile name.
   */
  name: string;

  /**
   * Desired frame rate.
   */
  targetFPS: number;

  /**
   * Galaxy quality tier.
   */
  galaxyQuality: GalaxyQuality;

  /**
   * Maximum stars.
   */
  starCount: number;

  /**
   * Maximum dust particles.
   */
  dustCount: number;

  /**
   * Hero stars.
   */
  heroStarCount: number;

  /**
   * SVG blur radius.
   */
  blurRadius: number;

  /**
   * Animation speed multiplier.
   */
  animationMultiplier: number;

  /**
   * Maximum DPR to render.
   */
  maxDevicePixelRatio: number;
}

export const PerformanceProfiles = {
  mobile: {
    name: "mobile",

    targetFPS: 60,

    galaxyQuality: "low",

    starCount: 2000,

    dustCount: 1200,

    heroStarCount: 18,

    blurRadius: 1.5,

    animationMultiplier: 0.9,

    maxDevicePixelRatio: 2,
  },

  tablet: {
    name: "tablet",

    targetFPS: 60,

    galaxyQuality: "medium",

    starCount: 3500,

    dustCount: 2400,

    heroStarCount: 24,

    blurRadius: 2,

    animationMultiplier: 1,

    maxDevicePixelRatio: 2.5,
  },

  laptop: {
    name: "laptop",

    targetFPS: 60,

    galaxyQuality: "high",

    starCount: 7000,

    dustCount: 4500,

    heroStarCount: 30,

    blurRadius: 2.5,

    animationMultiplier: 1,

    maxDevicePixelRatio: 3,
  },

  desktop: {
    name: "desktop",

    targetFPS: 60,

    galaxyQuality: "ultra",

    starCount: 12000,

    dustCount: 7000,

    heroStarCount: 40,

    blurRadius: 3,

    animationMultiplier: 1,

    maxDevicePixelRatio: 3,
  },

  workstation: {
    name: "workstation",

    targetFPS: 120,

    galaxyQuality: "ultra",

    starCount: 20000,

    dustCount: 12000,

    heroStarCount: 60,

    blurRadius: 3.5,

    animationMultiplier: 1,

    maxDevicePixelRatio: 4,
  },
} as const;

export type PerformanceTier =
  keyof typeof PerformanceProfiles;

export const DefaultPerformanceProfile =
  PerformanceProfiles.laptop;