export const Motion = {
  duration: {
    fast: 0.18,
    normal: 0.28,
    slow: 0.42,
  },

  easing: {
    smooth: [0.22, 1, 0.36, 1],
    standard: "ease-in-out",
  },

  hover: {
    scale: 1.02,
    lift: -4,
  },
} as const;