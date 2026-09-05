import type { FootballPlay } from "@/core/contracts/sports/Football";

export function touchdownKey(play: FootballPlay) {
  return play.id ?? `${play.period ?? ""}-${play.clock ?? ""}-${play.description}`;
}

/** Returns only a newly observed touchdown; initial history is intentionally silent. */
export function findNewTouchdown(previous: Set<string>, plays: FootballPlay[], initialized: boolean) {
  const touchdowns = plays.filter((play) => play.touchdown === true || (play.scoringPlay === true && play.description.toLowerCase().includes("touchdown")));
  if (!initialized) return undefined;
  return touchdowns.find((play) => !previous.has(touchdownKey(play)));
}
