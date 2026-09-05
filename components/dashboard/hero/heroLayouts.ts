import type { DisplayProfile } from "@/components/os/display";

export interface HeroTypography {
  greeting: number;

  clock: number;

  seconds: number;

  temperature: number;

  weather: number;

  details: number;
}

export interface HeroLayout {
  minHeight: number;

  padding: number;

  gap: number;

  rightColumnWidth: number;

  detailColumns: number;

  typography: HeroTypography;
}

export const HERO_LAYOUTS: Record<
  DisplayProfile,
  HeroLayout
> = {
  pocket: {
    minHeight: 300,

    padding: 16,

    gap: 12,

    rightColumnWidth: 240,

    detailColumns: 1,

    typography: {
      greeting: 38,
      clock: 36,
      seconds: 16,
      temperature: 48,
      weather: 16,
      details: 12,
    },
  },

  compact: {
    minHeight: 340,

    padding: 28,

    gap: 28,

    rightColumnWidth: 320,

    detailColumns: 2,

    typography: {
      greeting: 60,
      clock: 56,
      seconds: 22,
      temperature: 78,
      weather: 26,
      details: 15,
    },
  },

  comfortable: {
    minHeight: 360,

    padding: 40,

    gap: 40,

    rightColumnWidth: 420,

    detailColumns: 2,

    typography: {
      greeting: 72,
      clock: 72,
      seconds: 26,
      temperature: 90,
      weather: 30,
      details: 16,
    },
  },

  expanded: {
    minHeight: 420,

    padding: 48,

    gap: 48,

    rightColumnWidth: 500,

    detailColumns: 2,

    typography: {
      greeting: 84,
      clock: 88,
      seconds: 30,
      temperature: 104,
      weather: 34,
      details: 17,
    },
  },
};
