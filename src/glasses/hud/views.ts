import type { HudView } from "./types";

export const hudViews: HudView[] = [
  {
    id: "calendar",
    title: "CALENDAR",
    body: "CHEM 1210\n23 minutes",
    priority: "glance",
    timeoutMs: 8000,
  },
  {
    id: "sports",
    title: "SPORTS",
    body: "ANGELS        LIVE\nLAA 5   TEX 3\nTop 7th - 2 outs",
    priority: "glance",
    timeoutMs: 8000,
  },
  {
    id: "music",
    title: "MUSIC",
    body: "Song - Artist",
    priority: "glance",
    timeoutMs: 6000,
  },
  {
    id: "navigation",
    title: "NAVIGATION",
    body: "TURN RIGHT\n300 ft\nETA 10:14",
    priority: "attention",
    timeoutMs: 12000,
  },
  {
    id: "critical",
    title: "IMPORTANT",
    body: "Critical Cosmic alert",
    priority: "critical",
    timeoutMs: 15000,
  },
];