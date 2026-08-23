import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import type { SportKind, SportsEvent, SportsStanding } from "@/core/contracts/Sports";

export function isFollowedName(sport: SportKind, name: string | undefined, preferences: CosmicUserPreferences): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase();
  return preferences.sports.followedTeams.some((item) => item.sport === sport && item.label.toLowerCase() === normalized)
    || preferences.sports.followedDrivers.some((item) => item.sport === sport && item.label.toLowerCase() === normalized)
    || preferences.sports.followedConstructors.some((item) => item.sport === sport && item.label.toLowerCase() === normalized);
}

export function isFollowedStanding(standing: SportsStanding, preferences: CosmicUserPreferences): boolean {
  return isFollowedName(standing.sport, standing.name, preferences) || isFollowedName(standing.sport, standing.team, preferences) || isFollowedName(standing.sport, standing.driver, preferences);
}

export function isFollowedEvent(event: SportsEvent, preferences: CosmicUserPreferences): boolean {
  return isFollowedName(event.sport, event.homeTeam?.name, preferences) || isFollowedName(event.sport, event.awayTeam?.name, preferences);
}
