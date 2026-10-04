export type SportKind = "mlb" | "nfl" | "nba" | "mls" | "f1" | "nascar" | "college-football";

export type SportsEventStatus =
  | "scheduled"
  | "pregame"
  | "live"
  | "delayed"
  | "final"
  | "postponed"
  | "cancelled";

export type SportsNormalizedState = "scheduled" | "live" | "complete" | "unknown";

export type SportsStatusSource = "provider" | "inferred" | "unknown";

export interface SportsTeam {
  id?: string;
  name: string;
  abbreviation?: string;
  score?: number;
  record?: string;
  logo?: string;
}

export interface SportsEventMetadata {
  gamePk?: string;
  competition?: string;
  conference?: string;
  seasonType?: string;
  eventName?: string;
  sessionType?: string;
  circuit?: string;
  country?: string;
  track?: string;
  detail?: string;
  period?: number;
  clock?: string;
  possessionTeamId?: string;
  down?: number;
  distance?: number;
  downDistanceText?: string;
  possessionText?: string;
  minute?: number;
  sessionKind?: "practice" | "qualifying" | "sprint" | "race";
  location?: string;
  trackType?: string;
  circuitLength?: string;
  laps?: number;
  raceDistance?: string;
  driverId?: string;
  constructorId?: string;
  qualifyingPosition?: number;
  gridPosition?: number;
  finishingPosition?: number;
  points?: number;
  providerTeamId?: string;
  circuitId?: string;
  trackId?: string;
  trackConfiguration?: string;
  outlineAsset?: string;
  normalizedState?: SportsNormalizedState;
  statusSource?: SportsStatusSource;
  inferredLive?: boolean;
  expectedEnd?: string;
  staleAfter?: string;
  lastProviderRefresh?: string;
  timezoneResolved?: boolean;
  timezone?: string;
}

export interface SportsProviderCapabilities {
  schedule: boolean;
  liveScore: boolean;
  standings: boolean;
  results: boolean;
  sessions: boolean;
  telemetry: boolean;
}

export interface SportsSource {
  id: string;
  sport: SportKind;
  providerName: string;
  official: boolean;
  fallback: boolean;
  status: "ok" | "unavailable" | "fallback";
  capabilities: SportsProviderCapabilities;
  cacheSeconds: number;
  sourceUrl?: string;
}

export interface SportsEvent {
  id: string;
  sport: SportKind;
  title: string;
  start: Date;
  end?: Date;
  status: SportsEventStatus;
  statusDetail?: string;
  homeTeam?: SportsTeam;
  awayTeam?: SportsTeam;
  venue?: string;
  broadcast?: string;
  source: string;
  provider?: string;
  providerName?: string;
  official?: boolean;
  fallback?: boolean;
  sourceUrl?: string;
  metadata?: SportsEventMetadata;
}

export interface SportsStanding {
  id: string;
  sport: SportKind;
  rank?: number;
  name: string;
  team?: string;
  driver?: string;
  wins?: number;
  losses?: number;
  draws?: number;
  points?: number;
  goalDifference?: number;
  record?: string;
  conference?: string;
  division?: string;
  percentage?: string;
  gamesBehind?: string;
  streak?: string;
  source: string;
}

export interface SportsProviderError {
  sport: SportKind;
  provider: string;
  message: string;
}

export interface SportsSnapshot {
  live: SportsEvent[];
  upcoming: SportsEvent[];
  recent: SportsEvent[];
  featured: SportsEvent[];
  standings: Partial<Record<SportKind, SportsStanding[]>>;
  providerErrors: SportsProviderError[];
  sources: SportsSource[];
  lastUpdated: Date;
}
