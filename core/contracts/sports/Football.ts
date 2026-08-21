import type {
  SportsLiveDataBase,
  SportsTeamRef,
} from "./Core";

export type FootballPossessionSide =
  | "home"
  | "away"
  | "unknown";

export type FootballPlayType =
  | "pass"
  | "rush"
  | "punt"
  | "kickoff"
  | "field-goal"
  | "extra-point"
  | "two-point"
  | "sack"
  | "interception"
  | "fumble"
  | "penalty"
  | "timeout"
  | "kneel"
  | "spike"
  | "end-period"
  | "other";

export interface FootballTeamState {
  team: SportsTeamRef;

  score: number;

  record?: string;

  timeoutsRemaining?: number;

  possession?: boolean;
}

export interface FootballFieldPosition {
  /**
   * Team abbreviation for the side of the field.
   *
   * Example:
   * "GB"
   * "PIT"
   */
  territory?: string;

  /**
   * Yard line on that side of the field.
   *
   * Example:
   * 39 => GB 39
   */
  yardLine?: number;

  /**
   * ESPN-style display text.
   *
   * Example:
   * "GB 39"
   */
  display?: string;

  /**
   * Distance from the opponent end zone.
   */
  yardsToEndzone?: number;
}

export interface FootballSituation {
  quarter?: number;

  clock?: string;

  possession?: FootballPossessionSide;

  possessionTeamId?: string;

  possessionTeamAbbreviation?: string;

  down?: number;

  distance?: number;

  fieldPosition?: FootballFieldPosition;

  /**
   * Example:
   * "2nd & 12 at GB 39"
   */
  downDistanceText?: string;

  /**
   * Example:
   * "2nd & 12"
   */
  shortDownDistanceText?: string;

  /**
   * Example:
   * "GB 39"
   */
  possessionText?: string;

  redZone?: boolean;
}

export interface FootballDriveSummary {
  id?: string;

  teamId?: string;

  teamAbbreviation?: string;

  description?: string;

  result?: string;

  scoringDrive?: boolean;

  startPeriod?: number;

  endPeriod?: number;

  startClock?: string;

  endClock?: string;

  startFieldPosition?: string;

  endFieldPosition?: string;

  plays?: number;

  yards?: number;

  elapsedTime?: string;

  firstDowns?: number;

  offensiveTouchdowns?: number;

  fieldGoals?: number;

  turnovers?: number;
}

export interface FootballPlay {
  id?: string;

  sequence?: number;

  period?: number;

  clock?: string;

  wallclock?: string;

  type?: FootballPlayType;

  description: string;

  shortDescription?: string;

  teamId?: string;

  teamAbbreviation?: string;

  down?: number;

  distance?: number;

  downDistanceText?: string;

  shortDownDistanceText?: string;

  possessionText?: string;

  yardLine?: number;

  yardsToEndzone?: number;

  yardsGained?: number;

  scoringPlay?: boolean;

  touchdown?: boolean;

  turnover?: boolean;

  penalty?: boolean;

  firstDown?: boolean;

  sack?: boolean;

  interception?: boolean;

  fumble?: boolean;

  homeScore?: number;

  awayScore?: number;

  possessionAfterPlayTeamId?: string;
}

export interface FootballScoringPlay {
  id?: string;

  period?: number;

  clock?: string;

  teamId?: string;

  teamAbbreviation?: string;

  description: string;

  scoreAfter?: {
    home?: number;
    away?: number;
  };

  type?: FootballPlayType;
}

export interface FootballTeamStats {
  firstDowns?: number;

  totalYards?: number;

  passingYards?: number;

  rushingYards?: number;

  turnovers?: number;

  fumblesLost?: number;

  interceptionsThrown?: number;

  penalties?: number;

  penaltyYards?: number;

  possessionTime?: string;

  thirdDownMade?: number;

  thirdDownAttempts?: number;

  fourthDownMade?: number;

  fourthDownAttempts?: number;

  sacksAllowed?: number;

  yardsPerPlay?: number;

  redZoneMade?: number;

  redZoneAttempts?: number;
}

export interface FootballPassingStats {
  completions?: number;

  attempts?: number;

  yards?: number;

  touchdowns?: number;

  interceptions?: number;

  sacks?: number;

  sackYards?: number;

  yardsPerAttempt?: number;

  passerRating?: number;

  long?: number;
}

export interface FootballRushingStats {
  attempts?: number;

  yards?: number;

  touchdowns?: number;

  yardsPerCarry?: number;

  longest?: number;

  fumbles?: number;
}

export interface FootballReceivingStats {
  targets?: number;

  receptions?: number;

  yards?: number;

  touchdowns?: number;

  yardsPerReception?: number;

  longest?: number;
}

export interface FootballDefensiveStats {
  totalTackles?: number;

  soloTackles?: number;

  sacks?: number;

  tacklesForLoss?: number;

  passesDefended?: number;

  interceptions?: number;

  forcedFumbles?: number;

  fumbleRecoveries?: number;
}

export interface FootballKickingStats {
  fieldGoalsMade?: number;

  fieldGoalsAttempted?: number;

  extraPointsMade?: number;

  extraPointsAttempted?: number;

  longestFieldGoal?: number;

  points?: number;
}

export interface FootballPuntingStats {
  punts?: number;

  yards?: number;

  average?: number;

  longest?: number;

  inside20?: number;

  touchbacks?: number;
}

export interface FootballReturnStats {
  kickoffReturns?: number;

  kickoffReturnYards?: number;

  kickoffReturnTouchdowns?: number;

  puntReturns?: number;

  puntReturnYards?: number;

  puntReturnTouchdowns?: number;
}

export interface FootballPlayerStats {
  playerId?: string;

  name: string;

  shortName?: string;

  teamId?: string;

  teamAbbreviation?: string;

  position?: string;

  jerseyNumber?: string;

  passing?: FootballPassingStats;

  rushing?: FootballRushingStats;

  receiving?: FootballReceivingStats;

  defense?: FootballDefensiveStats;

  kicking?: FootballKickingStats;

  punting?: FootballPuntingStats;

  returns?: FootballReturnStats;
}

export interface FootballTeamStatBlock {
  teamId?: string;

  teamAbbreviation?: string;

  stats: FootballTeamStats;
}

export interface FootballVenueInfo {
  name?: string;

  city?: string;

  state?: string;

  indoor?: boolean;

  grass?: boolean;

  capacity?: number;
}

export interface FootballBroadcastInfo {
  network?: string;

  national?: boolean;

  streaming?: string[];

  radio?: string[];
}

export interface FootballWeatherInfo {
  temperatureF?: number;

  condition?: string;

  humidityPercent?: number;

  windMph?: number;

  windDirection?: string;
}

export interface FootballWinProbabilityPoint {
  playId?: string;

  sequence?: number;

  period?: number;

  clock?: string;

  description?: string;

  /**
   * Normalized 0-1.
   */
  home?: number;

  /**
   * Normalized 0-1.
   */
  away?: number;

  /**
   * Home probability change on this play.
   * Normalized to -1..1.
   */
  homeChange?: number;
}

export interface FootballWinProbability {
  home?: number;

  away?: number;

  lastChange?: {
    home?: number;
    away?: number;
  };

  history?: FootballWinProbabilityPoint[];
}

export interface FootballGameInfo {
  status?: string;

  statusDetail?: string;

  date?: string;

  attendance?: number;

  season?: number;

  seasonType?: number;
}

export interface FootballLiveData
  extends SportsLiveDataBase {
  sport: "nfl";

  game?: FootballGameInfo;

  home: FootballTeamState;

  away: FootballTeamState;

  situation: FootballSituation;

  currentDrive?: FootballDriveSummary;

  drives?: FootballDriveSummary[];

  latestPlay?: FootballPlay;

  /**
   * Small recent subset suitable for the kiosk/dashboard.
   */
  recentPlays?: FootballPlay[];

  /**
   * Full normalized play-by-play.
   *
   * We can later move this to a dedicated endpoint if the
   * payload becomes too heavy for the main live response.
   */
  plays?: FootballPlay[];

  scoringPlays?: FootballScoringPlay[];

  teamStats?: FootballTeamStatBlock[];

  playerStats?: FootballPlayerStats[];

  venue?: FootballVenueInfo;

  broadcast?: FootballBroadcastInfo;

  weather?: FootballWeatherInfo;

  winProbability?: FootballWinProbability;

  turnovers?: {
    home?: number;
    away?: number;
  };
}