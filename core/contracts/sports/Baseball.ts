import type {
  SportsLiveDataBase,
  SportsTeamRef,
} from "./Core";

export type BaseballInningHalf =
  | "top"
  | "bottom"
  | "middle"
  | "end"
  | "unknown";

export interface BaseballPlayerRef {
  id?: string;
  name: string;
  shortName?: string;
  position?: string;
  jerseyNumber?: string;
  teamId?: string;
}

export interface BaseballTeamState {
  team: SportsTeamRef;
  score: number;
  hits?: number;
  errors?: number;
  record?: string;
  uniform?: BaseballUniform;
}

export interface BaseballUniformAsset {
  id?: string;
  code?: string;
  text?: string;
  typeCode?: string;
  typeText?: string;
  active?: boolean;
}

/**
 * Uniform identity supplied by the MLB Stats API. The API does not provide
 * presentation colors, so consumers must retain the standard team theme when
 * no trusted uniform-to-theme mapping exists.
 */
export interface BaseballUniform {
  teamId?: string;
  teamName?: string;
  assets: BaseballUniformAsset[];
}

export interface BaseballBaseRunner {
  player?: BaseballPlayerRef;

  /**
   * Base the runner currently occupies.
   */
  base: 1 | 2 | 3;

  /**
   * True when the runner state was explicitly supplied
   * by the upstream provider.
   */
  confirmed?: boolean;
}

export interface BaseballBases {
  first?: BaseballBaseRunner;
  second?: BaseballBaseRunner;
  third?: BaseballBaseRunner;
}

export interface BaseballCount {
  balls?: number;
  strikes?: number;
  outs?: number;
}

export interface BaseballPitch {
  id?: string;

  pitchNumber?: number;

  typeCode?: string;

  typeName?: string;

  description?: string;

  result?: string;

  /**
   * Velocity in MPH.
   */
  velocityMph?: number;

  /**
   * Optional Statcast-style pitch measurements.
   * Only populate these when the upstream source supplies them.
   */
  spinRateRpm?: number;

  zone?: number;

  horizontalBreakInches?: number;

  verticalBreakInches?: number;

  extensionFeet?: number;

  /**
   * Plate coordinates if supplied.
   */
  plateX?: number;
  plateZ?: number;

  isStrike?: boolean;
  isBall?: boolean;
  inPlay?: boolean;
}

export interface BaseballMatchup {
  batter?: BaseballPlayerRef;
  pitcher?: BaseballPlayerRef;
  onDeck?: BaseballPlayerRef;
  inHole?: BaseballPlayerRef;
}

export interface BaseballPlay {
  id?: string;

  sequence?: number;

  inning?: number;

  inningHalf?: BaseballInningHalf;

  description: string;

  shortDescription?: string;

  eventType?: string;

  batter?: BaseballPlayerRef;

  pitcher?: BaseballPlayerRef;

  runsScored?: number;

  outsRecorded?: number;

  rbi?: number;

  scoringPlay?: boolean;

  isAtBat?: boolean;

  result?: string;

  pitch?: BaseballPitch;
}

export interface BaseballAtBat {
  id?: string;

  atBatIndex?: number;

  inning?: number;

  inningHalf?: BaseballInningHalf;

  batter?: BaseballPlayerRef;

  pitcher?: BaseballPlayerRef;

  count?: BaseballCount;

  description?: string;

  result?: string;

  pitches?: BaseballPitch[];

  runners?: BaseballBaseRunner[];
}

export interface BaseballInningLine {
  inning: number;

  home?: {
    runs?: number;
    hits?: number;
    errors?: number;
  };

  away?: {
    runs?: number;
    hits?: number;
    errors?: number;
  };
}

export interface BaseballLinescore {
  currentInning?: number;

  currentInningHalf?: BaseballInningHalf;

  innings: BaseballInningLine[];

  home: {
    runs?: number;
    hits?: number;
    errors?: number;
  };

  away: {
    runs?: number;
    hits?: number;
    errors?: number;
  };
}

export interface BaseballBattingStats {
  atBats?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  walks?: number;
  strikeouts?: number;
  stolenBases?: number;
  average?: string;
  onBasePercentage?: string;
  sluggingPercentage?: string;
  ops?: string;
}

export interface BaseballPitchingStats {
  inningsPitched?: string;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  walks?: number;
  strikeouts?: number;
  homeRuns?: number;
  pitchesThrown?: number;
  strikes?: number;
  era?: string;
}

export interface BaseballFieldingStats {
  putouts?: number;
  assists?: number;
  errors?: number;
}

export interface BaseballPlayerStats {
  player: BaseballPlayerRef;

  batting?: BaseballBattingStats;

  pitching?: BaseballPitchingStats;

  fielding?: BaseballFieldingStats;
}

export interface BaseballTeamBoxScore {
  teamId?: string;

  teamAbbreviation?: string;

  players?: BaseballPlayerStats[];

  batting?: BaseballBattingStats;

  pitching?: BaseballPitchingStats;
}

export interface BaseballBoxScore {
  home?: BaseballTeamBoxScore;
  away?: BaseballTeamBoxScore;
}

export interface BaseballProbablePitcher {
  teamId?: string;
  teamAbbreviation?: string;
  player: BaseballPlayerRef;
  wins?: number;
  losses?: number;
  era?: string;
}

export interface BaseballVenueInfo {
  name?: string;
  city?: string;
  state?: string;
  roof?: string;
  surface?: string;
}

export interface BaseballWeatherInfo {
  temperatureF?: number;
  condition?: string;
  humidityPercent?: number;
  wind?: string;
  windMph?: number;
  windDirection?: string;
}

export interface BaseballWinProbability {
  /**
   * Values are normalized from 0 to 1.
   */
  home?: number;
  away?: number;
}

export interface BaseballLiveData
  extends SportsLiveDataBase {
  sport: "mlb";

  home: BaseballTeamState;

  away: BaseballTeamState;

  inning?: number;

  inningHalf?: BaseballInningHalf;

  count?: BaseballCount;

  bases?: BaseballBases;

  matchup?: BaseballMatchup;

  currentAtBat?: BaseballAtBat;

  latestPitch?: BaseballPitch;

  latestPlay?: BaseballPlay;

  /**
   * Small recent subset suitable for kiosk/dashboard.
   * Full play-by-play can use a dedicated endpoint later.
   */
  recentPlays?: BaseballPlay[];

  linescore?: BaseballLinescore;

  boxScore?: BaseballBoxScore;

  probablePitchers?: {
    home?: BaseballProbablePitcher;
    away?: BaseballProbablePitcher;
  };

  venue?: BaseballVenueInfo;

  weather?: BaseballWeatherInfo;

  winProbability?: BaseballWinProbability;
}
