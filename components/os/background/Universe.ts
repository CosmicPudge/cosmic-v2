/**
 * Central configuration for the Cosmic background universe.
 * All generation, camera, projection, and drawing constants live here.
 */
export const Universe = {
  seed: "cosmic-universe-v1",

  world: {
    radius: 18000,
    diameter: 36000,
    cullingPadding: 320,
  },

  camera: {
    initialPositionX: 0,
    initialPositionY: 0,
    initialZoom: 1,
    minimumZoom: 0.45,
    maximumZoom: 2.4,
    driftAmplitudeX: 900,
    driftAmplitudeY: 650,
    driftSpeedX: 0.000012,
    driftSpeedY: 0.000009,
    rotationAmplitude: 0.018,
    rotationSpeed: 0.000006,
  },

  sky: {
    galaxyBand: {
      centerOffsetY: -900,
      width: 5200,
      rotationRadians: -0.22,
      densityMultiplier: 2.8,
      edgeSoftness: 0.72,
      noiseScale: 0.00022,
      noiseStrength: 0.65,
    },

    clusters: {
      count: 18,
      minimumRadius: 700,
      maximumRadius: 2200,
      minimumDensityMultiplier: 1.3,
      maximumDensityMultiplier: 3.8,
    },

    voids: {
      count: 12,
      minimumRadius: 900,
      maximumRadius: 2800,
      minimumDensityMultiplier: 0.08,
      maximumDensityMultiplier: 0.42,
    },

    stars: {
      totalCount: 9200,
      heroCount: 18,
      brightCount: 145,
      normalCount: 2150,
      microCount: 6887,

      heroRadiusMinimum: 3.2,
      heroRadiusMaximum: 5.8,
      brightRadiusMinimum: 1.6,
      brightRadiusMaximum: 3.1,
      normalRadiusMinimum: 0.75,
      normalRadiusMaximum: 1.65,
      microRadiusMinimum: 0.2,
      microRadiusMaximum: 0.72,

      heroDepthMinimum: 0.15,
      heroDepthMaximum: 0.35,
      brightDepthMinimum: 0.25,
      brightDepthMaximum: 0.55,
      normalDepthMinimum: 0.4,
      normalDepthMaximum: 0.8,
      microDepthMinimum: 0.65,
      microDepthMaximum: 1,

      twinkleSpeedMinimum: 0.0004,
      twinkleSpeedMaximum: 0.0018,
      twinkleStrengthMinimum: 0.05,
      twinkleStrengthMaximum: 0.3,

      baseOpacityMinimum: 0.34,
      baseOpacityMaximum: 1,
    },

    colors: {
      blueWhite: "#C9DDFF",
      coolWhite: "#E7F0FF",
      softWhite: "#FFF8E8",
      warmWhite: "#FFE0B2",
      amber: "#FFC87A",
      paleRose: "#FFD1DC",
      violet: "#D8C6FF",
      colorWeights: {
        blueWhite: 0.22,
        coolWhite: 0.32,
        softWhite: 0.24,
        warmWhite: 0.1,
        amber: 0.04,
        paleRose: 0.04,
        violet: 0.04,
      },
    },
  },

  nebula: {
    layerCount: 4,
    wispsPerLayer: 950,
    distributionRadius: 15000,
    bandDensityMultiplier: 1.9,
    wispRadiusMinimum: 90,
    wispRadiusMaximum: 540,
    wispOpacityMinimum: 0.012,
    wispOpacityMaximum: 0.09,
    wispBlurMinimum: 18,
    wispBlurMaximum: 90,
    depthMinimum: 0.1,
    depthMaximum: 0.95,
    rotationMinimum: -Math.PI,
    rotationMaximum: Math.PI,
    stretchMinimum: 1.8,
    stretchMaximum: 5.5,
    noiseScale: 0.0003,
    noiseStrength: 0.78,
    colors: [
      "#2B5C9D",
      "#4F4F9C",
      "#744A91",
      "#9B4B7B",
      "#1F6F78",
      "#416C9A",
    ],
  },

  rendering: {
    devicePixelRatioMaximum: 2,
    backgroundColor: "#050712",
    starGlowMultiplier: 5.5,
    heroStarGlowMultiplier: 11,
    heroSpikeLengthMultiplier: 5.2,
    heroSpikeWidth: 0.7,
    normalStarAlphaMultiplier: 0.9,
    microStarAlphaMultiplier: 0.55,
    depthParallaxStrength: 0.14,
    nebulaParallaxStrength: 0.07,
    projectionNearDepth: 0.1,
    projectionFarDepth: 1,
  },
} as const;

export type UniverseSettings = typeof Universe;