import type {
  DisplayProfile,
  DisplayTokens,
} from "./types";

export const DISPLAY_PROFILES: Record<
  DisplayProfile,
  DisplayTokens
> = {
  pocket: {
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },

    radius: {
      sm: 12,
      md: 18,
      lg: 24,
      xl: 30,
    },

    widgetGap: 12,

    iconScale: 0.8,

    fontScale: 0.9,

    blur: 18,
  },

  compact: {
    spacing: {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 22,
      xl: 30,
    },

    radius: {
      sm: 16,
      md: 22,
      lg: 30,
      xl: 36,
    },

    widgetGap: 18,

    iconScale: 0.95,

    fontScale: 1,

    blur: 24,
  },

  comfortable: {
    spacing: {
      xs: 8,
      sm: 12,
      md: 20,
      lg: 28,
      xl: 36,
    },

    radius: {
      sm: 18,
      md: 24,
      lg: 32,
      xl: 40,
    },

    widgetGap: 24,

    iconScale: 1,

    fontScale: 1,

    blur: 28,
  },

  expanded: {
    spacing: {
      xs: 10,
      sm: 16,
      md: 24,
      lg: 36,
      xl: 48,
    },

    radius: {
      sm: 20,
      md: 28,
      lg: 36,
      xl: 48,
    },

    widgetGap: 30,

    iconScale: 1.1,

    fontScale: 1.08,

    blur: 32,
  },
};