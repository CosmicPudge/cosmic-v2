export const FOOTBALL_LIVE_DETAIL_POLL_MS = 500;
export const FOOTBALL_HALFTIME_DETAIL_POLL_MS = 3_000;
export const FOOTBALL_PREGAME_DETAIL_POLL_MS = 30_000;
export const FOOTBALL_FINAL_DETAIL_POLL_MS = 60_000;

export type FootballDetailPollMode = "live" | "halftime" | "pregame" | "final" | "idle";

export function footballDetailPollMode(status?: string, state?: string): FootballDetailPollMode {
  const value = `${state ?? ""} ${status ?? ""}`.toLowerCase();
  if (!value.trim()) return "idle";
  if (value.includes("final") || value.includes("complete") || value.includes("postgame")) return "final";
  if (value.includes("half")) return "halftime";
  if (value.includes("live") || value.includes("progress") || value.includes("quarter") || value.includes("overtime")) return "live";
  if (value.includes("pregame") || value.includes("scheduled") || value.includes("starting")) return "pregame";
  return "idle";
}

export function footballDetailPollMs(mode: FootballDetailPollMode) {
  switch (mode) {
    case "live": return FOOTBALL_LIVE_DETAIL_POLL_MS;
    case "halftime": return FOOTBALL_HALFTIME_DETAIL_POLL_MS;
    case "pregame": return FOOTBALL_PREGAME_DETAIL_POLL_MS;
    case "final": return FOOTBALL_FINAL_DETAIL_POLL_MS;
    default: return FOOTBALL_FINAL_DETAIL_POLL_MS;
  }
}
