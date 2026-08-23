import type { SportsProvider } from "./types";
import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import { EspnTeamProvider, packersProvider, usuFootballProvider } from "./espn-team";
import { F1Provider } from "./f1";
import { MlbAngelsProvider } from "./mlb";
import { NascarProvider } from "./nascar";
import { EspnLeagueProvider, mlsProvider, nbaProvider } from "./espn-league";

export type { SportsProvider, SportsProviderResult } from "./types";
export { EspnLeagueProvider, EspnTeamProvider, F1Provider, MlbAngelsProvider, NascarProvider, mlsProvider, nbaProvider, packersProvider, usuFootballProvider };

export function sportsProviders(preferences?: CosmicUserPreferences): SportsProvider[] {
  const followed = preferences?.sports.followedTeams ?? [];
  const teamProviders: SportsProvider[] = followed.flatMap((team): SportsProvider[] => {
    if (team.sport === "mlb" && team.provider === "mlb") return [new MlbAngelsProvider({ teamId: team.teamId, teamName: team.label })];
    if ((team.sport === "nfl" || team.sport === "college-football") && team.provider === "espn") return [new EspnTeamProvider({ id: `${team.sport}-${team.teamId}-espn-fallback`, sport: team.sport, teamId: team.teamId, leaguePath: team.sport === "nfl" ? "football/nfl" : "football/college-football", cacheSeconds: team.sport === "nfl" ? 600 : 900 })];
    return [];
  });
  const hasNbaFollow = followed.some((team) => team.sport === "nba");
  const hasMlsFollow = followed.some((team) => team.sport === "mls");
  const hasF1Follow = Boolean(preferences?.sports.followedDrivers.length || preferences?.sports.followedConstructors.length);
  const hasNascarFollow = Boolean(preferences?.sports.followedDrivers.some((driver) => driver.sport === "nascar"));
  return [...teamProviders, ...(hasNbaFollow ? [nbaProvider] : []), ...(hasMlsFollow ? [mlsProvider] : []), ...(hasF1Follow ? [new F1Provider()] : []), ...(hasNascarFollow ? [new NascarProvider()] : [])];
}
