"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  Alarm,
  ClockHourFormat,
  ClockLocalData,
  ClockTimer,
  StopwatchState,
  WorldClockLocation,
} from "@/core/contracts/Clock";
import { getStopwatchElapsed, getTimerRemaining } from "./time";
import { createScopedStorageKey, migrateLegacyStorage, readScopedOrLegacy, useCosmicScope } from "@/services/storage/scope";

export const CLOCK_STORAGE_KEY = "cosmic.clock.local-data";
export const CLOCK_UPDATE_EVENT = "cosmic:clock-local-data-updated";

const defaultStopwatch: StopwatchState = {
  status: "stopped",
  elapsedAtPause: 0,
  laps: [],
};

export const defaultClockData: ClockLocalData = {
  version: 1,
  preferences: { hourFormat: "system" },
  worldClocks: [],
  alarms: [],
  timers: [],
  timerPresets: [
    { id: "one-minute", label: "1 min", durationMs: 60_000 },
    { id: "five-minutes", label: "5 min", durationMs: 5 * 60_000 },
    { id: "ten-minutes", label: "10 min", durationMs: 10 * 60_000 },
    { id: "fifteen-minutes", label: "15 min", durationMs: 15 * 60_000 },
    { id: "thirty-minutes", label: "30 min", durationMs: 30 * 60_000 },
    { id: "one-hour", label: "1 hour", durationMs: 60 * 60_000 },
  ],
  stopwatch: defaultStopwatch,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasId(value: unknown): value is { id: string } {
  return isRecord(value) && typeof value.id === "string";
}

function isHourFormat(value: unknown): value is ClockHourFormat {
  return value === "system" || value === "12" || value === "24";
}

export function readClockSnapshot(scopeId?: string) {
  try {
    const stored = readScopedOrLegacy("clock", scopeId); const raw = stored.raw;
    if (stored.migrated && raw) migrateLegacyStorage("clock", raw, scopeId);
    if (!raw) return defaultClockData;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1) return defaultClockData;

    const preferences = isRecord(value.preferences) && isHourFormat(value.preferences.hourFormat)
      ? { hourFormat: value.preferences.hourFormat }
      : defaultClockData.preferences;
    const stopwatch = isRecord(value.stopwatch) && Array.isArray(value.stopwatch.laps)
      ? value.stopwatch as unknown as StopwatchState
      : defaultStopwatch;

    return {
      version: 1 as const,
      preferences,
      worldClocks: Array.isArray(value.worldClocks)
        ? value.worldClocks.filter(hasId) as WorldClockLocation[]
        : [],
      alarms: Array.isArray(value.alarms) ? value.alarms.filter(hasId) as Alarm[] : [],
      timers: Array.isArray(value.timers) ? value.timers.filter(hasId) as ClockTimer[] : [],
      timerPresets: Array.isArray(value.timerPresets)
        ? value.timerPresets.filter(hasId) as ClockLocalData["timerPresets"]
        : defaultClockData.timerPresets,
      stopwatch,
    } satisfies ClockLocalData;
  } catch {
    return defaultClockData;
  }
}

export function replaceClockSnapshot(data: ClockLocalData, scopeId?: string) {
  if (data.version !== 1 || !isHourFormat(data.preferences.hourFormat) || !Array.isArray(data.worldClocks) || !Array.isArray(data.alarms) || !Array.isArray(data.timers) || !Array.isArray(data.timerPresets) || !isRecord(data.stopwatch)) {
    throw new Error("Invalid Clock data.");
  }
  window.localStorage.setItem(createScopedStorageKey("clock", scopeId), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(CLOCK_UPDATE_EVENT, { detail: { scopeId, data } }));
}

function dataMatches(left: ClockLocalData, right: ClockLocalData) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function upsert<T extends { id: string }>(items: T[], item: T) {
  return items.some((entry) => entry.id === item.id)
    ? items.map((entry) => entry.id === item.id ? item : entry)
    : [...items, item];
}

export function useClockRepository() {
  const scope = useCosmicScope();
  const [data, setData] = useState<ClockLocalData>(defaultClockData);
  const [ready, setReady] = useState(false);
  const [loadedScope, setLoadedScope] = useState<string>();

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setData(readClockSnapshot(scope.id));
      setLoadedScope(scope.id);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(initial);
  }, [scope.id]);

  useEffect(() => {
    if (!ready) return;
    if (loadedScope !== scope.id) return;
    replaceClockSnapshot(data, scope.id);
  }, [data, ready, loadedScope, scope.id]);

  useEffect(() => {
    const sync = (incoming: Event) => {
      const detail = incoming instanceof CustomEvent ? incoming.detail as { scopeId?: string; data?: ClockLocalData } : undefined;
      if (detail?.scopeId && detail.scopeId !== scope.id) return;
      const next = detail?.data ?? readClockSnapshot(scope.id);
      setData((current) => dataMatches(current, next) ? current : next);
    };
    const storageSync = (incoming: StorageEvent) => {
      if (incoming.key === createScopedStorageKey("clock", scope.id) || incoming.key === CLOCK_STORAGE_KEY) sync(incoming);
    };

    window.addEventListener("storage", storageSync);
    window.addEventListener(CLOCK_UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", storageSync);
      window.removeEventListener(CLOCK_UPDATE_EVENT, sync);
    };
  }, [scope.id]);

  const update = useCallback(
    (operation: (current: ClockLocalData) => ClockLocalData) => setData(operation),
    [],
  );

  const saveAlarm = useCallback(
    (alarm: Alarm) => update((current) => ({ ...current, alarms: upsert(current.alarms, alarm) })),
    [update],
  );

  const startTimer = useCallback((id: string, now = Date.now()) => {
    update((current) => ({
      ...current,
      timers: current.timers.map((timer) => {
        if (timer.id !== id || timer.status === "running") return timer;
        const remaining = timer.status === "complete"
          ? timer.durationMs
          : timer.remainingAtPause;
        return {
          ...timer,
          status: "running",
          startedAt: now,
          targetEndAt: now + remaining,
          remainingAtPause: remaining,
          completedAt: undefined,
        };
      }),
    }));
  }, [update]);

  const pauseTimer = useCallback((id: string, now = Date.now()) => {
    update((current) => ({
      ...current,
      timers: current.timers.map((timer) => timer.id === id && timer.status === "running"
        ? {
            ...timer,
            status: "paused",
            remainingAtPause: getTimerRemaining(timer, now),
            startedAt: undefined,
            targetEndAt: undefined,
          }
        : timer),
    }));
  }, [update]);

  const completeExpiredTimers = useCallback((now: number) => {
    update((current) => {
      let changed = false;
      const timers = current.timers.map((timer) => {
        if (timer.status !== "running" || getTimerRemaining(timer, now) > 0) return timer;
        changed = true;
        return {
          ...timer,
          status: "complete" as const,
          remainingAtPause: 0,
          targetEndAt: undefined,
          completedAt: now,
        };
      });
      return changed ? { ...current, timers } : current;
    });
  }, [update]);

  const pauseStopwatch = useCallback((now = Date.now()) => {
    update((current) => ({
      ...current,
      stopwatch: current.stopwatch.status === "running"
        ? {
            ...current.stopwatch,
            status: "paused",
            elapsedAtPause: getStopwatchElapsed(current.stopwatch, now),
            startedAt: undefined,
          }
        : current.stopwatch,
    }));
  }, [update]);

  return {
    data,
    ready,
    setHourFormat: (hourFormat: ClockHourFormat) => update((current) => ({
      ...current,
      preferences: { ...current.preferences, hourFormat },
    })),
    saveWorldClock: (location: WorldClockLocation) => update((current) => ({
      ...current,
      worldClocks: upsert(current.worldClocks, location),
    })),
    removeWorldClock: (id: string) => update((current) => ({
      ...current,
      worldClocks: current.worldClocks.filter((location) => location.id !== id),
    })),
    saveAlarm,
    removeAlarm: (id: string) => update((current) => ({
      ...current,
      alarms: current.alarms.filter((alarm) => alarm.id !== id),
    })),
    createTimer: (timer: ClockTimer) => update((current) => ({
      ...current,
      timers: [...current.timers, timer],
    })),
    startTimer,
    pauseTimer,
    resetTimer: (id: string) => update((current) => ({
      ...current,
      timers: current.timers.map((timer) => timer.id === id
        ? {
            ...timer,
            status: "idle",
            remainingAtPause: timer.durationMs,
            startedAt: undefined,
            targetEndAt: undefined,
            completedAt: undefined,
          }
        : timer),
    })),
    removeTimer: (id: string) => update((current) => ({
      ...current,
      timers: current.timers.filter((timer) => timer.id !== id),
    })),
    completeExpiredTimers,
    startStopwatch: (now = Date.now()) => update((current) => ({
      ...current,
      stopwatch: current.stopwatch.status === "running"
        ? current.stopwatch
        : { ...current.stopwatch, status: "running", startedAt: now },
    })),
    pauseStopwatch,
    lapStopwatch: (now = Date.now()) => update((current) => {
      if (current.stopwatch.status !== "running") return current;
      const totalElapsedMs = getStopwatchElapsed(current.stopwatch, now);
      const previousTotal = current.stopwatch.laps.at(-1)?.totalElapsedMs ?? 0;
      return {
        ...current,
        stopwatch: {
          ...current.stopwatch,
          laps: [...current.stopwatch.laps, {
            id: crypto.randomUUID(),
            lapDurationMs: totalElapsedMs - previousTotal,
            totalElapsedMs,
          }],
        },
      };
    }),
    resetStopwatch: () => update((current) => ({
      ...current,
      stopwatch: defaultStopwatch,
    })),
  };
}

export type ClockRepository = ReturnType<typeof useClockRepository>;
