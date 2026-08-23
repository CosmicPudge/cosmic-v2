import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import type { SportKind, SportsEvent, SportsSource } from "@/core/contracts/Sports";
import { neutralPreferences } from "@/services/settings/preferences";

export const sportOrder = ["nfl", "mlb", "nba", "mls", "f1", "nascar"] as SportKind[];

export const sportLabels: Record<SportKind, string> = {
  mlb: "MLB",
  nfl: "NFL",
  nba: "NBA",
  mls: "MLS",
  f1: "Formula 1",
  nascar: "NASCAR",
  "college-football": "College Football",
};

export function eventMatchesPreferences(event: SportsEvent, preferences: CosmicUserPreferences = neutralPreferences): boolean {
  if (!preferences.sports.enabledSports.includes(event.sport)) return false;
  const teams = preferences.sports.followedTeams.filter((team) => team.sport === event.sport);
  const names = [event.homeTeam?.name, event.awayTeam?.name].filter((name): name is string => Boolean(name));
  if (teams.length && !teams.some((team) => [event.homeTeam?.id, event.awayTeam?.id].includes(team.teamId) || names.some((name) => name.toLowerCase() === team.label.toLowerCase()))) return false;
  if ((event.sport === "f1" || event.sport === "nascar") && (preferences.sports.followedDrivers.length || preferences.sports.followedConstructors.length)) {
    // Schedule providers do not consistently attach driver identities to race events;
    // keep the race eligible for a driver follower until that identity is available.
    return true;
  }
  return true;
}

export function followedEventRank(event: SportsEvent, preferences: CosmicUserPreferences = neutralPreferences): number {
  const teamNames = [event.homeTeam?.name, event.awayTeam?.name].filter((name): name is string => Boolean(name));
  const teamIndex = preferences.sports.followedTeams.findIndex((team) => team.sport === event.sport && ([event.homeTeam?.id, event.awayTeam?.id].includes(team.teamId) || teamNames.some((name) => name.toLowerCase() === team.label.toLowerCase())));
  return teamIndex >= 0 ? teamIndex : sportOrder.indexOf(event.sport) + preferences.sports.followedTeams.length + 1;
}

export function prioritizeFollowedEvents(events: SportsEvent[], preferences: CosmicUserPreferences = neutralPreferences): SportsEvent[] {
  return [...events].filter((event) => eventMatchesPreferences(event, preferences)).sort((first, second) => followedEventRank(first, preferences) - followedEventRank(second, preferences) || first.start.getTime() - second.start.getTime());
}

const unavailableCapabilities = { schedule: false, liveScore: false, standings: false, results: false, sessions: false, telemetry: false };

// These official public pages are references only until their owners expose a stable,
// unauthenticated structured feed. The fallback providers remain explicit in diagnostics.
export const officialSourceReferences: SportsSource[] = [
  { id: "mlb-official", sport: "mlb", providerName: "MLB Stats API", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://statsapi.mlb.com" },
  { id: "nfl-official", sport: "nfl", providerName: "NFL", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.nfl.com/schedules" },
  { id: "nba-official", sport: "nba", providerName: "NBA", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.nba.com/schedule" },
  { id: "mls-official", sport: "mls", providerName: "MLS", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.mlssoccer.com/schedule" },
  { id: "formula1-official", sport: "f1", providerName: "Formula1.com", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.formula1.com/en/racing" },
  { id: "nascar-official-reference", sport: "nascar", providerName: "NASCAR", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.nascar.com/schedule/" },
  { id: "college-football-official", sport: "college-football", providerName: "College Football", official: true, fallback: false, status: "unavailable", capabilities: unavailableCapabilities, cacheSeconds: 0, sourceUrl: "https://www.ncaa.com/sports/football/fbs" },
];
