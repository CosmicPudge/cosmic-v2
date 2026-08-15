export type ClockHourFormat = "system" | "12" | "24";

export interface ClockPreferences {
  hourFormat: ClockHourFormat;
}

export interface WorldClockLocation {
  id: string;
  label: string;
  timeZone: string;
  createdAt: string;
}

export interface Alarm {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
  repeatWeekdays: number[];
  snoozeEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: number;
  snoozedUntil?: number;
}

export type ClockTimerStatus = "idle" | "running" | "paused" | "complete";

export interface ClockTimer {
  id: string;
  label: string;
  durationMs: number;
  status: ClockTimerStatus;
  remainingAtPause: number;
  createdAt: string;
  startedAt?: number;
  targetEndAt?: number;
  completedAt?: number;
}

export interface TimerPreset {
  id: string;
  label: string;
  durationMs: number;
}

export interface StopwatchLap {
  id: string;
  lapDurationMs: number;
  totalElapsedMs: number;
}

export interface StopwatchState {
  status: "stopped" | "running" | "paused";
  elapsedAtPause: number;
  laps: StopwatchLap[];
  startedAt?: number;
}

export interface ClockLocalData {
  version: 1;
  preferences: ClockPreferences;
  worldClocks: WorldClockLocation[];
  alarms: Alarm[];
  timers: ClockTimer[];
  timerPresets: TimerPreset[];
  stopwatch: StopwatchState;
}
