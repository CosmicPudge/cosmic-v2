import type { FootballLiveData } from "@/core/contracts/sports/Football";
import { diffFootballState } from "./stateDiff";

export interface FootballSoakResult {
  updates: number;
  scoreChanges: number;
  maxRecentPlays: number;
  maxRecentDrives: number;
  eventId: string;
}

/** Deterministic, allocation-bounded fixture for long-game lifecycle tests. */
export function runFootballSoakSimulation(playCount = 180): FootballSoakResult {
  const eventId = "soak-event";
  let previous: FootballLiveData = { sport: "nfl", eventId, generatedAt: "soak", stale: false, sources: [], away: { team: { id: "away", name: "Away" }, score: 0 }, home: { team: { id: "home", name: "Home" }, score: 0 }, situation: {} };
  let updates = 0;
  let scoreChanges = 0;
  let recentPlays: string[] = [];
  let recentDrives: string[] = [];
  for (let index = 0; index < playCount; index += 1) {
    const score = index > 0 && index % 24 === 0 ? (previous.home.score ?? 0) + 7 : previous.home.score;
    const next: FootballLiveData = { ...previous, generatedAt: `soak-${index}`, home: { ...previous.home, score }, clock: `${Math.max(0, 14 - Math.floor(index / 12))}:${String(59 - (index % 60)).padStart(2, "0")}`, period: Math.min(4, 1 + Math.floor(index / 45)), situation: { possessionTeamId: index % 2 ? "home" : "away", downDistanceText: `${(index % 4) + 1} & ${(index % 10) + 1}` }, latestPlay: { id: `play-${index}`, description: index % 24 === 0 ? "Touchdown" : "Pass complete", type: "pass", scoringPlay: index % 24 === 0, touchdown: index % 24 === 0 } };
    const delta = diffFootballState(previous, next);
    if (delta.scoreChanged) scoreChanges += 1;
    updates += 1;
    recentPlays = [...recentPlays, next.latestPlay!.id!].slice(-8);
    if (index % 8 === 0) recentDrives = [...recentDrives, `drive-${index}`].slice(-6);
    previous = next;
  }
  return { updates, scoreChanges, maxRecentPlays: Math.min(8, recentPlays.length), maxRecentDrives: Math.min(6, recentDrives.length), eventId };
}
