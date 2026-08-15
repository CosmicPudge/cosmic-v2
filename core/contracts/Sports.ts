export type SportKind = "mlb" | "nfl" | "f1" | "nascar" | "college-football";

export type SportsEventStatus =
  | "scheduled"
  | "pregame"
  | "live"
  | "delayed"
  | "final"
  | "postponed"
  | "cancelled";

export interface SportsTeam {
  id?: string;
  name: string;
  abbreviation?: string;
  score?: number;
  record?: string;
}

export interface SportsEventMetadata {
  competition?: string;
  seasonType?: string;
  eventName?: string;
  sessionType?: string;
  circuit?: string;
  country?: string;
  track?: string;
  detail?: string;
  sessionKind?: "practice" | "qualifying" | "sprint" | "race";
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
  points?: number;
  record?: string;
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
