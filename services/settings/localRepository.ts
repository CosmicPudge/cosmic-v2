"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AmbientIdleMinutes,
  BackgroundIntensity,
  BackgroundMotion,
  CosmicSettingsLocalData,
} from "@/core/contracts/Settings";
import type { DeviceProfileOverride, PerformanceMode } from "@/core/contracts/System";

export const SETTINGS_STORAGE_KEY = "cosmic.settings.local-data";
export const SETTINGS_UPDATE_EVENT = "cosmic:settings-local-data-updated";

export const defaultSettingsData: CosmicSettingsLocalData = {
  version: 1,
  appearance: { reducedEffects: false },
  background: { intensity: "normal", motion: "normal" },
  ambient: { enabled: true, idleMinutes: 5 },
  system: { performanceMode: "automatic", deviceProfileOverride: "automatic" },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntensity(value: unknown): value is BackgroundIntensity {
  return value === "low" || value === "normal" || value === "high";
}

function isMotion(value: unknown): value is BackgroundMotion {
  return value === "off" || value === "subtle" || value === "normal";
}

function isIdleMinutes(value: unknown): value is AmbientIdleMinutes {
  return value === null || value === 1 || value === 2 || value === 5 || value === 10 || value === 15 || value === 30;
}

function isPerformanceMode(value: unknown): value is PerformanceMode {
  return value === "automatic" || value === "full" || value === "balanced" || value === "reduced";
}

function isDeviceProfileOverride(value: unknown): value is DeviceProfileOverride {
  return value === "automatic" || value === "desktop" || value === "tablet" || value === "phone" || value === "display";
}

export function validateSettingsSnapshot(value: unknown): CosmicSettingsLocalData | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const appearance = value.appearance;
  const background = value.background;
  const ambient = value.ambient;
  const system = value.system;
  if (!isRecord(appearance) || typeof appearance.reducedEffects !== "boolean") return null;
  if (!isRecord(background) || !isIntensity(background.intensity) || !isMotion(background.motion)) return null;
  if (!isRecord(ambient) || typeof ambient.enabled !== "boolean" || !isIdleMinutes(ambient.idleMinutes)) return null;
  const normalizedSystem = isRecord(system)
    && isPerformanceMode(system.performanceMode)
    && isDeviceProfileOverride(system.deviceProfileOverride)
    ? { performanceMode: system.performanceMode, deviceProfileOverride: system.deviceProfileOverride }
    : defaultSettingsData.system;
  return {
    version: 1,
    appearance: { reducedEffects: appearance.reducedEffects },
    background: { intensity: background.intensity, motion: background.motion },
    ambient: { enabled: ambient.enabled, idleMinutes: ambient.idleMinutes },
    system: normalizedSystem,
  };
}

export function readSettingsSnapshot(): CosmicSettingsLocalData {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? validateSettingsSnapshot(JSON.parse(raw)) ?? defaultSettingsData : defaultSettingsData;
  } catch {
    return defaultSettingsData;
  }
}

export function replaceSettingsSnapshot(data: CosmicSettingsLocalData) {
  const validated = validateSettingsSnapshot(data);
  if (!validated) throw new Error("Invalid Settings data.");
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(validated));
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATE_EVENT, { detail: validated }));
}

export function useSettingsRepository() {
  const [data, setData] = useState(defaultSettingsData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setData(readSettingsSnapshot());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    replaceSettingsSnapshot(data);
  }, [data, ready]);

  useEffect(() => {
    const sync = (event: Event) => {
      const next = event instanceof CustomEvent
        ? validateSettingsSnapshot(event.detail)
        : readSettingsSnapshot();
      if (!next) return;
      setData((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY) sync(event);
    };
    window.addEventListener("storage", storage);
    window.addEventListener(SETTINGS_UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener(SETTINGS_UPDATE_EVENT, sync);
    };
  }, []);

  const update = useCallback((recipe: (current: CosmicSettingsLocalData) => CosmicSettingsLocalData) => {
    setData((current) => recipe(current));
  }, []);

  return {
    data,
    ready,
    setReducedEffects: (reducedEffects: boolean) => update((current) => ({ ...current, appearance: { reducedEffects } })),
    setBackgroundIntensity: (intensity: BackgroundIntensity) => update((current) => ({ ...current, background: { ...current.background, intensity } })),
    setBackgroundMotion: (motion: BackgroundMotion) => update((current) => ({ ...current, background: { ...current.background, motion } })),
    setAmbientEnabled: (enabled: boolean) => update((current) => ({
      ...current,
      ambient: {
        enabled,
        idleMinutes: enabled && current.ambient.idleMinutes === null ? 5 : current.ambient.idleMinutes,
      },
    })),
    setAmbientIdleMinutes: (idleMinutes: AmbientIdleMinutes) => update((current) => ({ ...current, ambient: { enabled: idleMinutes !== null, idleMinutes } })),
    setPerformanceMode: (performanceMode: PerformanceMode) => update((current) => ({ ...current, system: { ...current.system, performanceMode } })),
    setDeviceProfileOverride: (deviceProfileOverride: DeviceProfileOverride) => update((current) => ({ ...current, system: { ...current.system, deviceProfileOverride } })),
    reset: () => setData(defaultSettingsData),
  };
}

export type SettingsRepository = ReturnType<typeof useSettingsRepository>;
