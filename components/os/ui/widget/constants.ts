export const WIDGET_RADIUS = 36;

export const WIDGET_PADDING = 32;

export const WIDGET_GAP = 24;

export const WIDGET_SECTION_GAP = 20;

export const WIDGET_TRANSITION = {
  type: "spring",
  stiffness: 260,
  damping: 24,
} as const;

export const WIDGET_ACCENTS = {
  default: "from-white/8",

  weather: "from-sky-400/12",
  calendar: "from-violet-400/12",
  sports: "from-green-400/12",
  garage: "from-orange-400/12",
  school: "from-blue-400/12",
  cosmic: "from-cyan-400/12",

  projects: "from-purple-400/12",
  notifications: "from-red-400/12",
  notes: "from-yellow-400/12",
  outlook: "from-indigo-400/12",
  system: "from-slate-400/12",
  music: "from-pink-400/12",
  search: "from-teal-400/12",
  briefing: "from-fuchsia-400/12",
  clock: "from-zinc-400/12",
} as const;