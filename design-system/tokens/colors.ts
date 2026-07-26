export const Colors = {
  surface: {
    primary: "#0B1018",
    secondary: "#131B27",
    tertiary: "#1B2635",
  },

  text: {
    primary: "#FFFFFF",
    secondary: "#D7E2F0",
    tertiary: "#9AA9BC",
    muted: "#738196",
  },

  border: {
    subtle: "rgba(255,255,255,0.06)",
    normal: "rgba(255,255,255,0.10)",
    strong: "rgba(255,255,255,0.16)",
  },

  glass: {
    light: "rgba(255,255,255,0.04)",
    medium: "rgba(255,255,255,0.06)",
    heavy: "rgba(255,255,255,0.10)",
  },

weather: {
  // Base Weather
  clear: "#6DB7FF",
  cloudy: "#8E9AA8",
  rain: "#4A90E2",
  storm: "#8A63FF",
  snow: "#EAF4FF",
  fog: "#C7CDD7",
  wind: "#80D8FF",

  // Clouds
  cloudLight: "#F4F8FC",
  cloudMid: "#D7E2EE",
  cloudDark: "#B6C2CF",

  // Sun
  sunCore: "#FFE38A",
  sunInner: "#FFEFA8",
  sunMiddle: "#FFD45F",
  sunOuter: "#FFB340",
  sunRay: "#FFC857",
  sunGlow: "rgba(255,227,138,0.45)",

  // Moon
  moon: "#E6EEF9",
  moonLight: "#F8FBFF",
  moonDark: "#D5E2F4",
  moonShadow: "#B7C6D9",
  moonGlow: "rgba(221,232,255,0.35)",

  // Rain
  rainLight: "#8ED0FF",
  rainDark: "#2C74C9",

  // Snow
  snowLight: "#FFFFFF",
  snowDark: "#DCEEFF",

  // Lightning
  lightning: "#FFE96A",

  // Stars
  star: "#FFFFFF",
  starGlow: "rgba(255,255,255,0.28)",
},
} as const;