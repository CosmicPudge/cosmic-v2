export const Colors = {
  weather: {
    // ☀️ Sun
    sunInner: "#FFE66D",
    sunMiddle: "#FFD54F",
    sunOuter: "#FDB813",
    sunRay: "#FACC15",
    sunGlow: "#FFE38A",

    // 🌙 Moon
     moon: "#F6F1D3",
    moonLight: "#FFFBE8",
    moonShadow: "#DDD5B5",
    moonGlow: "#FFF6CC",

    // ☁️ Clouds
    cloudLight: "#F8FAFC",
    cloudMid: "#E2E8F0",
    cloudDark: "#CBD5E1",
    cloudShadow: "#94A3B8",

    // 🌧 Rain
    rain: "#60A5FA",
    rainDark: "#3B82F6",

    // ❄️ Snow
    snow: "#F8FAFC",
    snowShadow: "#CBD5E1",

    // ⚡ Lightning
    lightning: "#FACC15",
    lightningGlow: "#FDE047",

    // 💨 Wind
    wind: "#D8E8F8",

    // 🌫 Fog
    fog: "#E5EAF0",

    // ⭐ Stars
    star: "#FFF7CC",
  },

  ui: {
    background: "#0F172A",

    card: "#151A22",
    cardHover: "#1D2430",

    border: "#2B3644",

    text: "#F8FAFC",
    muted: "#94A3B8",

    accent: "#4F9DFF",

    success: "#22C55E",
    warning: "#FACC15",
    danger: "#EF4444",
    info: "#38BDF8",
  },

  gradients: {
    sunrise: [
      "#F59E0B",
      "#F97316",
    ],

    sunset: [
      "#FB7185",
      "#A855F7",
    ],

    aurora: [
      "#22D3EE",
      "#4ADE80",
    ],
  },
} as const;