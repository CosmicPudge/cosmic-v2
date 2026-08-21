import type {
  SportsCompetitorRef,
  SportsLiveDataBase,
} from "./Core";

export type F1SessionType =
  | "practice"
  | "qualifying"
  | "sprint"
  | "race";

export type F1SessionStatus =
  | "scheduled"
  | "starting"
  | "active"
  | "suspended"
  | "finished"
  | "cancelled"
  | "unknown";

export type F1TrackStatus =
  | "green"
  | "yellow"
  | "double-yellow"
  | "red"
  | "safety-car"
  | "virtual-safety-car"
  | "chequered"
  | "unknown";

export type F1TireCompound =
  | "soft"
  | "medium"
  | "hard"
  | "intermediate"
  | "wet"
  | "unknown";

export interface F1DriverRef extends SportsCompetitorRef {
  driverNumber?: number;
  code?: string;
  teamName?: string;
  teamColor?: string;
  countryCode?: string;
}

export interface F1SectorTime {
  sector: 1 | 2 | 3;

  /**
   * Seconds.
   */
  timeSeconds?: number;

  personalBest?: boolean;

  overallBest?: boolean;
}

export interface F1MiniSector {
  sector?: number;

  segment?: number;

  /**
   * Provider-specific status normalized only where possible.
   */
  status?: string;

  personalBest?: boolean;

  overallBest?: boolean;
}

export interface F1LapTime {
  lapNumber?: number;

  /**
   * Seconds.
   */
  lapTimeSeconds?: number;

  sectors?: F1SectorTime[];

  miniSectors?: F1MiniSector[];

  personalBest?: boolean;

  overallBest?: boolean;

  invalid?: boolean;

  pitIn?: boolean;

  pitOut?: boolean;

  speedTrapKph?: number;
}

export interface F1TireState {
  compound?: F1TireCompound;

  /**
   * Number of laps completed on the current tire set.
   */
  tireAgeLaps?: number;

  fresh?: boolean;

  stintNumber?: number;
}

export interface F1PitStop {
  lap?: number;

  /**
   * Pit lane duration in seconds if supplied.
   */
  durationSeconds?: number;

  stopNumber?: number;

  compoundBefore?: F1TireCompound;

  compoundAfter?: F1TireCompound;
}

export interface F1TelemetrySample {
  /**
   * ISO timestamp from the provider when available.
   */
  timestamp?: string;

  speedKph?: number;

  rpm?: number;

  gear?: number;

  /**
   * Normalized from 0 to 1.
   */
  throttle?: number;

  brake?: boolean;

  drs?: boolean;

  /**
   * Provider-specific DRS state where a boolean loses useful detail.
   */
  drsState?: number;
}

export interface F1DriverTiming {
  driver: F1DriverRef;

  position?: number;

  startingPosition?: number;

  positionChange?: number;

  lapsCompleted?: number;

  gapToLeader?: string;

  intervalToAhead?: string;

  lastLap?: F1LapTime;

  bestLap?: F1LapTime;

  tire?: F1TireState;

  pitStops?: F1PitStop[];

  inPit?: boolean;

  retired?: boolean;

  classified?: boolean;

  telemetry?: F1TelemetrySample;
}

export interface F1RaceControlMessage {
  id?: string;

  timestamp?: string;

  lap?: number;

  category?: string;

  flag?: F1TrackStatus;

  scope?: string;

  driverNumber?: number;

  message: string;
}

export interface F1WeatherInfo {
  airTemperatureC?: number;

  trackTemperatureC?: number;

  humidityPercent?: number;

  rainfall?: boolean;

  windSpeedKph?: number;

  windDirectionDegrees?: number;

  pressureHpa?: number;
}

export interface F1SessionInfo {
  name?: string;

  type: F1SessionType;

  status?: F1SessionStatus;

  trackStatus?: F1TrackStatus;

  circuitName?: string;

  country?: string;

  lapNumber?: number;

  totalLaps?: number;

  sessionTimeRemaining?: string;
}

export interface F1TeamRadio {
  driverNumber?: number;

  driverCode?: string;

  timestamp?: string;

  recordingUrl?: string;
}

export interface F1ChampionshipStanding {
  position?: number;

  driver?: F1DriverRef;

  constructor?: string;

  points?: number;

  wins?: number;
}

export interface F1ConstructorStanding {
  position?: number;

  constructor: string;

  points?: number;

  wins?: number;
}

export interface F1FocusDriverData {
  driver: F1DriverRef;

  position?: number;

  startingPosition?: number;

  positionChange?: number;

  gapToLeader?: string;

  intervalToAhead?: string;

  lapsCompleted?: number;

  lastLap?: F1LapTime;

  bestLap?: F1LapTime;

  tire?: F1TireState;

  pitStops?: F1PitStop[];

  telemetry?: F1TelemetrySample;

  championshipPosition?: number;

  championshipPoints?: number;
}

export interface F1LiveData
  extends SportsLiveDataBase {
  sport: "f1";

  session: F1SessionInfo;

  /**
   * Full current running order.
   */
  runningOrder: F1DriverTiming[];

  /**
   * Max Verstappen-focused data for Cosmic.
   * Keep this generic enough that favorites can change later.
   */
  focusDriver?: F1FocusDriverData;

  raceControl?: F1RaceControlMessage[];

  weather?: F1WeatherInfo;

  teamRadio?: F1TeamRadio[];

  driverStandings?: F1ChampionshipStanding[];

  constructorStandings?: F1ConstructorStanding[];
}