import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import type { SportKind, SportsEvent, SportsSource } from "@/core/contracts/Sports";
import { neutralPreferences } from "@/services/settings/preferences";

export const sportOrder = ["nfl", "mlb", "college-football", "nba", "mls", "f1", "nascar"] as SportKind[];

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
  return preferences.sports.enabledSports.includes(event.sport);
}

export function followedEventRank(event: SportsEvent, preferences: CosmicUserPreferences = neutralPreferences): number {
  const teamNames = [event.homeTeam?.name, event.awayTeam?.name].filter((name): name is string => Boolean(name));
  const teamIndex = preferences.sports.followedTeams.findIndex((team) => team.sport === event.sport && ([event.homeTeam?.id, event.awayTeam?.id].includes(team.teamId) || teamNames.some((name) => name.toLowerCase() === team.label.toLowerCase())));
  if (teamIndex >= 0) return teamIndex;
  if (event.sport === "f1" || event.sport === "nascar") {
    const hasFavorite = preferences.sports.followedDrivers.some((driver) => driver.sport === event.sport || (event.sport === "f1" && driver.sport === undefined))
      || (event.sport === "f1" && preferences.sports.followedConstructors.some((constructor) => constructor.sport === "f1" || constructor.sport === undefined));
    if (hasFavorite) return 0;
  }
  return sportOrder.indexOf(event.sport) + preferences.sports.followedTeams.length + 1;
}

export function prioritizeFollowedEvents(events: SportsEvent[], preferences: CosmicUserPreferences = neutralPreferences): SportsEvent[] {
  return [...events].filter((event) => eventMatchesPreferences(event, preferences)).sort((first, second) => followedEventRank(first, preferences) - followedEventRank(second, preferences) || first.start.getTime() - second.start.getTime());
}

export function isFavoriteEvent(event: SportsEvent, preferences: CosmicUserPreferences = neutralPreferences): boolean {
  const names = [event.homeTeam?.name, event.awayTeam?.name].filter((name): name is string => Boolean(name));
  const ids = [event.homeTeam?.id, event.awayTeam?.id].filter((id): id is string => Boolean(id));
  if (preferences.sports.followedTeams.some((team) => team.sport === event.sport && (ids.includes(team.teamId) || names.some((name) => name.toLowerCase() === team.label.toLowerCase())))) return true;
  if (event.sport === "f1" || event.sport === "nascar") {
    const metadata = event.metadata;
    const followedDriver = preferences.sports.followedDrivers.some((driver) => (driver.sport === event.sport || (event.sport === "f1" && driver.sport === undefined)) && (!metadata?.driverId || metadata.driverId === driver.id));
    const followedConstructor = event.sport === "f1" && preferences.sports.followedConstructors.some((constructor) => (constructor.sport === "f1" || constructor.sport === undefined) && (!metadata?.constructorId || metadata.constructorId === constructor.id));
    return followedDriver || followedConstructor;
  }
  return false;
}

export function favoriteFirstSections(events: SportsEvent[], preferences: CosmicUserPreferences = neutralPreferences) {
  const unique = new Map<string, SportsEvent>();
  for (const event of events) unique.set(event.id, event);
  const ordered = [...unique.values()].sort((first, second) => {
    const temporal = (value: SportsEvent) => value.status === "live" || value.status === "delayed" ? 0 : value.status === "final" || value.status === "cancelled" || value.status === "postponed" ? 2 : 1;
    const firstTemporal = temporal(first); const secondTemporal = temporal(second);
    if (firstTemporal !== secondTemporal) return firstTemporal - secondTemporal;
    const favoriteDelta = Number(isFavoriteEvent(second, preferences)) - Number(isFavoriteEvent(first, preferences));
    if (favoriteDelta) return favoriteDelta;
    return firstTemporal === 2 ? second.start.getTime() - first.start.getTime() : first.start.getTime() - second.start.getTime();
  });
  return {
    now: ordered.filter((event) => event.status === "live" || event.status === "delayed"),
    next: ordered.filter((event) => event.status !== "live" && event.status !== "delayed" && event.status !== "final" && event.status !== "cancelled" && event.status !== "postponed"),
    recent: ordered.filter((event) => event.status === "final" || event.status === "cancelled" || event.status === "postponed"),
  };
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
