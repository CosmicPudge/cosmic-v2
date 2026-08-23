"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AmbientIdleMinutes,
  BackgroundIntensity,
  BackgroundMotion,
  CosmicSettingsLocalData,
} from "@/core/contracts/Settings";
import type { DeviceProfileOverride, PerformanceMode } from "@/core/contracts/System";
import type { CosmicProfileId, CosmicUserPreferences } from "@/core/contracts/Settings";
import { clonePreferences, neutralPreferences, preferencesForProfile, referencePreferences } from "./preferences";
import { createScopedStorageKey, migrateLegacyStorage, readScopedOrLegacy, useCosmicScope } from "@/services/storage/scope";
import { useCloudSnapshotSync } from "@/services/sync/useCloudSnapshotSync";
import { defaultAIPermissions, type CosmicAIPermissions } from "@/core/contracts/AI";

export const SETTINGS_STORAGE_KEY = "cosmic.settings.local-data";
export const SETTINGS_UPDATE_EVENT = "cosmic:settings-local-data-updated";

export const defaultSettingsData: CosmicSettingsLocalData = {
  version: 1,
  profileId: "neutral",
  preferences: clonePreferences(neutralPreferences),
  profiles: { neutral: clonePreferences(neutralPreferences), reference: clonePreferences(referencePreferences) },
  appearance: { reducedEffects: false },
  background: { intensity: "normal", motion: "normal" },
  ambient: { enabled: true, idleMinutes: 5 },
  system: { performanceMode: "automatic", deviceProfileOverride: "automatic" },
};

export const referenceSettingsData: CosmicSettingsLocalData = {
  ...defaultSettingsData,
  profileId: "reference",
  preferences: clonePreferences(referencePreferences),
  profiles: { neutral: clonePreferences(neutralPreferences), reference: clonePreferences(referencePreferences) },
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
  const hasPreferences = isRecord(value.preferences);
  const profileId: CosmicProfileId = value.profileId === "neutral" || value.profileId === "reference" || value.profileId === "sports-heavy" || value.profileId === "student" || value.profileId === "minimal" ? value.profileId : hasPreferences ? "neutral" : "reference";
  const preferences = hasPreferences && isRecord(value.preferences) ? validatePreferences(value.preferences) : clonePreferences(referencePreferences);
  const profiles = isRecord(value.profiles) ? Object.fromEntries(Object.entries(value.profiles).flatMap(([key, item]) => { const parsed = isRecord(item) ? validatePreferences(item) : null; return parsed && (key === "neutral" || key === "reference" || key === "sports-heavy" || key === "student" || key === "minimal") ? [[key, parsed]] : []; })) as Partial<Record<CosmicProfileId, CosmicUserPreferences>> : { neutral: clonePreferences(neutralPreferences), reference: clonePreferences(referencePreferences) };
  return {
    version: 1,
    profileId,
    preferences: preferences ?? preferencesForProfile(profileId),
    profiles,
    appearance: { reducedEffects: appearance.reducedEffects },
    background: { intensity: background.intensity, motion: background.motion },
    ambient: { enabled: ambient.enabled, idleMinutes: ambient.idleMinutes },
    system: normalizedSystem,
  };
}

function validatePreferences(value: Record<string, unknown>): CosmicUserPreferences | null {
  const sports = value.sports;
  const dashboard = value.dashboard;
  const modules = value.modules;
  const context = value.context;
  if (!isRecord(sports) || !Array.isArray(sports.enabledSports) || !Array.isArray(sports.followedTeams) || !Array.isArray(sports.followedDrivers) || !Array.isArray(sports.followedConstructors) || !isRecord(dashboard) || !Array.isArray(dashboard.visibleWidgets) || !Array.isArray(dashboard.widgetOrder) || !isRecord(dashboard.widgetSizes) || !isRecord(modules) || !isRecord(context) || !Array.isArray(context.enabledSources) || !Array.isArray(context.suppressedKinds)) return null;
  const enabledSports = sports.enabledSports.filter((item): item is CosmicUserPreferences["sports"]["enabledSports"][number] => ["mlb", "nfl", "nba", "mls", "f1", "nascar", "college-football"].includes(String(item)));
  const followedTeams = sports.followedTeams.filter((item): item is CosmicUserPreferences["sports"]["followedTeams"][number] => isRecord(item) && typeof item.teamId === "string" && typeof item.label === "string" && (item.provider === "mlb" || item.provider === "espn" || item.provider === "pending") && ["mlb", "nfl", "nba", "mls", "college-football"].includes(String(item.sport))).map((item) => ({ sport: item.sport, provider: item.provider, teamId: item.teamId, label: item.label }));
  const followedDrivers = sports.followedDrivers.filter((item): item is { id: string; label: string; sport?: "f1" | "nascar" } => isRecord(item) && typeof item.id === "string" && typeof item.label === "string" && (item.sport === undefined || item.sport === "f1" || item.sport === "nascar")).map((item) => ({ id: item.id, label: item.label, ...(item.sport ? { sport: item.sport } : {}) }));
  const followedConstructors = sports.followedConstructors.filter((item): item is { id: string; label: string; sport?: "f1" } => isRecord(item) && typeof item.id === "string" && typeof item.label === "string" && (item.sport === undefined || item.sport === "f1")).map((item) => ({ id: item.id, label: item.label, ...(item.sport ? { sport: item.sport } : {}) }));
  const notificationDefaults = neutralPreferences.sports.notifications;
  const rawNotifications = isRecord(sports.notifications) ? sports.notifications : undefined;
  const notifications = rawNotifications ? Object.fromEntries(Object.keys(notificationDefaults).map((key) => [key, rawNotifications[key] === true])) as unknown as CosmicUserPreferences["sports"]["notifications"] : notificationDefaults;
  const moduleNames = ["sports", "finance", "school", "garage", "mail", "calendar", "projects", "notes"] as const;
  const normalizedModules = Object.fromEntries(moduleNames.map((name) => [name, modules[name] !== false])) as CosmicUserPreferences["modules"];
  const contextDensity = dashboard.contextDensity === "sparse" || dashboard.contextDensity === "full" ? dashboard.contextDensity : "balanced";
  const garageDefaults = neutralPreferences.garage?.notifications;
  const rawGarage = isRecord(value.garage) && isRecord(value.garage.notifications) ? value.garage.notifications : {};
  const garageNotifications = garageDefaults ? Object.fromEntries(Object.keys(garageDefaults).map((key) => [key, rawGarage[key] === true])) as unknown as NonNullable<CosmicUserPreferences["garage"]>["notifications"] : undefined;
  const rawAI = isRecord(value.ai) ? value.ai : {};
  const rawAIModules = isRecord(rawAI.modules) ? rawAI.modules : {};
  const ai: CosmicAIPermissions = { enabled: rawAI.enabled !== false, modules: Object.fromEntries(Object.keys(defaultAIPermissions.modules).map((key) => [key, rawAIModules[key] === undefined ? defaultAIPermissions.modules[key as keyof typeof defaultAIPermissions.modules] : rawAIModules[key] === true])) as CosmicAIPermissions["modules"] };
  return { version: 1, sports: { enabledSports, followedTeams, followedDrivers, followedConstructors, notifications }, garage: garageNotifications ? { notifications: garageNotifications } : undefined, dashboard: { visibleWidgets: dashboard.visibleWidgets.filter((item): item is string => typeof item === "string"), widgetOrder: dashboard.widgetOrder.filter((item): item is string => typeof item === "string"), widgetSizes: Object.fromEntries(Object.entries(dashboard.widgetSizes).filter(([, size]) => size === "small" || size === "medium" || size === "large")) as CosmicUserPreferences["dashboard"]["widgetSizes"], contextDensity }, modules: normalizedModules, context: { enabledSources: context.enabledSources.filter((item): item is string => typeof item === "string"), suppressedKinds: context.suppressedKinds.filter((item): item is string => typeof item === "string") }, ai };
}

export function readSettingsSnapshot(scopeId?: string): CosmicSettingsLocalData {
  try {
    const stored = readScopedOrLegacy("settings", scopeId); const raw = stored.raw;
    if (stored.migrated && raw) migrateLegacyStorage("settings", raw, scopeId);
    return raw ? validateSettingsSnapshot(JSON.parse(raw)) ?? (scopeId === "local" ? referenceSettingsData : defaultSettingsData) : (scopeId === "local" ? referenceSettingsData : defaultSettingsData);
  } catch {
    return defaultSettingsData;
  }
}

export function replaceSettingsSnapshot(data: CosmicSettingsLocalData, scopeId?: string) {
  const validated = validateSettingsSnapshot(data);
  if (!validated) throw new Error("Invalid Settings data.");
  window.localStorage.setItem(createScopedStorageKey("settings", scopeId), JSON.stringify(validated));
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATE_EVENT, { detail: validated }));
}

export function useSettingsRepository() {
  const scope = useCosmicScope();
  const [data, setData] = useState(defaultSettingsData);
  const [ready, setReady] = useState(false);
  const [loadedScope, setLoadedScope] = useState<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setData(readSettingsSnapshot(scope.id));
      setLoadedScope(scope.id);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [scope.id]);

  const sync = useCloudSnapshotSync({ domain: "settings", scope, ready: ready && loadedScope === scope.id, data, setData, equals: (left, right) => JSON.stringify(left) === JSON.stringify(right) });

  useEffect(() => {
    if (!ready) return;
    if (loadedScope !== scope.id) return;
    replaceSettingsSnapshot(data, scope.id);
  }, [data, ready, loadedScope, scope.id]);

  useEffect(() => {
    const sync = (event: Event) => {
      const next = event instanceof CustomEvent
        ? validateSettingsSnapshot(event.detail)
        : readSettingsSnapshot(scope.id);
      if (!next) return;
      setData((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === createScopedStorageKey("settings", scope.id) || event.key === SETTINGS_STORAGE_KEY) sync(event);
    };
    window.addEventListener("storage", storage);
    window.addEventListener(SETTINGS_UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener(SETTINGS_UPDATE_EVENT, sync);
    };
  }, [scope.id]);

  const update = useCallback((recipe: (current: CosmicSettingsLocalData) => CosmicSettingsLocalData) => {
    setData((current) => recipe(current));
  }, []);

  return {
    data,
    ready,
    sync,
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
    setProfile: (profileId: CosmicProfileId) => update((current) => ({ ...current, profileId, profiles: { ...current.profiles, [current.profileId]: clonePreferences(current.preferences) }, preferences: clonePreferences(current.profiles?.[profileId] ?? preferencesForProfile(profileId)) })),
    setPreferences: (preferences: CosmicUserPreferences) => update((current) => ({ ...current, preferences: clonePreferences(preferences), profiles: { ...current.profiles, [current.profileId]: clonePreferences(preferences) } })),
    reset: () => setData(defaultSettingsData),
  };
}

export type SettingsRepository = ReturnType<typeof useSettingsRepository>;
