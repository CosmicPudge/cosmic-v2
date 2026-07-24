export interface GalaxyTheme {
  dust: {
    count: number;
    minRadius: number;
    maxRadius: number;
    minOpacity: number;
    maxOpacity: number;
    exposure: number;
  };

  stars: {
    backgroundCount: number;
    midCount: number;
    foregroundCount: number;

    backgroundExposure: number;
    midExposure: number;
    foregroundExposure: number;

    glow: number;
  };

  hero: {
    count: number;
    exposure: number;
    glow: number;
    spikeChance: number;
  };

  milkyWay: {
    exposure: number;
    opacity: number;
  };

  nebula: {
    exposure: number;
    opacity: number;
  };
}

export const CosmicGalaxyTheme: GalaxyTheme = {
  dust: {
    count: 18000,
    minRadius: 0.015,
    maxRadius: 0.08,
    minOpacity: 0.015,
    maxOpacity: 0.06,
    exposure: 0.9,
  },

  stars: {
    backgroundCount: 3500,
    midCount: 1800,
    foregroundCount: 350,

    backgroundExposure: 0.35,
    midExposure: 0.65,
    foregroundExposure: 1,

    glow: 0.12,
  },

  hero: {
    count: 24,
    exposure: 1,
    glow: 0.35,
    spikeChance: 0.33,
  },

  milkyWay: {
    exposure: 0.65,
    opacity: 0.03,
  },

  nebula: {
    exposure: 0.45,
    opacity: 0.045,
  },
};