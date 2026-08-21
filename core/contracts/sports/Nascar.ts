import type {
  SportsCompetitorRef,
  SportsLiveDataBase,
} from "./Core";

export type NascarFlagState =
  | "green"
  | "yellow"
  | "red"
  | "white"
  | "checkered"
  | "black"
  | "unknown";

export interface NascarDriverRef extends SportsCompetitorRef {
  carNumber?: string;
  manufacturer?: string;
  teamName?: string;
}

export interface NascarStageInfo {
  stageNumber: number;

  startLap?: number;

  endLap?: number;

  completed?: boolean;

  winnerDriverId?: string;

  winnerName?: string;
}

export interface NascarStageResult {
  stageNumber: number;

  position?: number;

  driver?: NascarDriverRef;

  points?: number;
}

export interface NascarLapLeader {
  driver?: NascarDriverRef;

  startLap?: number;

  endLap?: number;

  lapsLed?: number;
}

export interface NascarCaution {
  id?: string;

  cautionNumber?: number;

  startLap?: number;

  endLap?: number;

  reason?: string;

  beneficiaryDriverId?: string;

  beneficiaryDriverName?: string;
}

export interface NascarPenalty {
  id?: string;

  driver?: NascarDriverRef;

  lap?: number;

  type?: string;

  description?: string;

  served?: boolean;
}

export interface NascarPitStop {
  id?: string;

  driver?: NascarDriverRef;

  lap?: number;

  stopNumber?: number;

  /**
   * Total pit lane time in seconds when supplied.
   */
  pitLaneTimeSeconds?: number;

  /**
   * Stationary pit-box time in seconds when supplied.
   */
  pitStopTimeSeconds?: number;

  entryPosition?: number;

  exitPosition?: number;

  /**
   * Cosmic-derived field only when both entry and exit
   * position are known.
   */
  positionChange?: number;

  /**
   * True when positionChange was calculated by Cosmic.
   */
  positionChangeDerived?: boolean;
}

export interface NascarDriverTiming {
  driver: NascarDriverRef;

  position?: number;

  startingPosition?: number;

  positionChange?: number;

  lapsCompleted?: number;

  lapsLed?: number;

  lastLapTimeSeconds?: number;

  bestLapTimeSeconds?: number;

  speedMph?: number;

  gapToLeader?: string;

  intervalToAhead?: string;

  inPit?: boolean;

  onTrack?: boolean;

  retired?: boolean;

  runningStatus?: string;

  pitStops?: NascarPitStop[];
}

export interface NascarRaceState {
  lap?: number;

  totalLaps?: number;

  lapsRemaining?: number;

  flag?: NascarFlagState;

  stageNumber?: number;

  stageLap?: number;

  stageLapsRemaining?: number;

  elapsedTime?: string;

  leadChanges?: number;

  cautionCount?: number;

  cautionLaps?: number;
}

export interface NascarFocusDriverData {
  driver: NascarDriverRef;

  position?: number;

  startingPosition?: number;

  positionChange?: number;

  lapsCompleted?: number;

  lapsLed?: number;

  gapToLeader?: string;

  intervalToAhead?: string;

  lastLapTimeSeconds?: number;

  bestLapTimeSeconds?: number;

  speedMph?: number;

  inPit?: boolean;

  onTrack?: boolean;

  runningStatus?: string;

  pitStops?: NascarPitStop[];

  penalties?: NascarPenalty[];
}

export interface NascarLiveData
  extends SportsLiveDataBase {
  sport: "nascar";

  race: NascarRaceState;

  /**
   * Full current running order.
   */
  runningOrder: NascarDriverTiming[];

  /**
   * Carson Hocevar-focused data for Cosmic.
   * This remains generic enough to change favorites later.
   */
  focusDriver?: NascarFocusDriverData;

  stages?: NascarStageInfo[];

  stageResults?: NascarStageResult[];

  lapLeaders?: NascarLapLeader[];

  cautions?: NascarCaution[];

  penalties?: NascarPenalty[];

  recentPitStops?: NascarPitStop[];
}