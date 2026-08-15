import type { SportKind, SportsEvent, SportsSource } from "@/core/contracts/Sports";

export const sportsPreferences = {
  sportOrder: ["mlb", "nfl", "f1", "nascar", "college-football"] as SportKind[],
  followed: {
    mlbTeam: "Los Angeles Angels",
    nflTeam: "Green Bay Packers",
    f1Driver: "Max Verstappen",
    f1Constructor: "Red Bull Racing",
    collegeFootballTeam: "Utah State Aggies",
  },
};

export const sportLabels: Record<SportKind, string> = {
  mlb: "Los Angeles Angels",
  nfl: "Green Bay Packers",
  f1: "Formula 1",
  nascar: "NASCAR",
  "college-football": "Utah State Football",
};

export function followedEventRank(event: SportsEvent): number {
  const teamNames = [event.homeTeam?.name, event.awayTeam?.name].filter((name): name is string => Boolean(name));
  if (teamNames.some((name) => name.includes(sportsPreferences.followed.mlbTeam))) return 0;
  if (teamNames.some((name) => name.includes(sportsPreferences.followed.nflTeam))) return 1;
  if (teamNames.some((name) => name.includes(sportsPreferences.followed.collegeFootballTeam))) return 2;
  return sportsPreferences.sportOrder.indexOf(event.sport) + 3;
}

export function prioritizeFollowedEvents(events: SportsEvent[]): SportsEvent[] {
  return [...events].sort((first, second) => followedEventRank(first) - followedEventRank(second) || first.start.getTime() - second.start.getTime());
}

const unavailableCapabilities = { schedule: false, liveScore: false, standings: false, results: false, sessions: false, telemetry: false };

// These official public pages are references only until their owners expose a stable,
// unauthenticated structured feed. The fallback providers remain explicit in diagnostics.
export const officialSourceReferences: SportsSource[] = [
  { id: "packers-official", sport: "nfl", providerName: "Green Bay Packers", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.packers.com/schedule" },
  { id: "formula1-official", sport: "f1", providerName: "Formula1.com", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.formula1.com/en/racing" },
  { id: "utah-state-official", sport: "college-football", providerName: "Utah State Athletics", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://utahstateaggies.com/sports/football/schedule" },
];
