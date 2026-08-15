import type { SportsProvider } from "./types";
import { EspnTeamProvider, packersProvider, usuFootballProvider } from "./espn-team";
import { F1Provider } from "./f1";
import { MlbAngelsProvider } from "./mlb";
import { NascarProvider } from "./nascar";

export type { SportsProvider, SportsProviderResult } from "./types";
export { EspnTeamProvider, F1Provider, MlbAngelsProvider, NascarProvider, packersProvider, usuFootballProvider };

export function sportsProviders(): SportsProvider[] {
  return [new MlbAngelsProvider(), packersProvider, new F1Provider(), new NascarProvider(), usuFootballProvider];
}
