"use client";

import type {
  BackupPreview,
  CosmicBackupDomain,
  CosmicLocalBackup,
  CosmicLocalBackupDomains,
} from "@/core/contracts/Settings";
import {
  emptySchoolData,
  readSchoolSnapshot,
  replaceSchoolSnapshot,
} from "@/components/school/data/localRepository";
import {
  defaultClockData,
  readClockSnapshot,
  replaceClockSnapshot,
} from "@/services/clock/localRepository";
import {
  emptyGarageData,
  readGarageSnapshot,
  replaceGarageSnapshot,
} from "@/services/garage/localRepository";
import {
  emptyNotesData,
  readNotesSnapshot,
  replaceNotesSnapshot,
} from "@/services/notes/localRepository";
import {
  emptyProjectsData,
  readProjectsSnapshot,
  replaceProjectsSnapshot,
} from "@/services/projects/localRepository";
import {
  clearRecentSearches,
  readRecentSearches,
  replaceRecentSearches,
} from "@/services/search/recentRepository";
import {
  defaultSettingsData,
  readSettingsSnapshot,
  replaceSettingsSnapshot,
  validateSettingsSnapshot,
} from "./localRepository";

export const COSMIC_APP_VERSION = "0.1.0";
export const backupDomains: CosmicBackupDomain[] = [
  "settings",
  "school",
  "garage",
  "projects",
  "notes",
  "clock",
  "search",
];

type DomainSnapshots = CosmicLocalBackupDomains;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasArrays(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => Array.isArray(value[key]));
}

function hasStringId(value: unknown): value is { id: string } {
  return isRecord(value) && typeof value.id === "string";
}

function allHaveStringId(value: unknown) {
  return Array.isArray(value) && value.every(hasStringId);
}

function validateDomain(domain: CosmicBackupDomain, value: unknown): DomainSnapshots[typeof domain] | null {
  if (domain === "settings") return validateSettingsSnapshot(value);
  if (!isRecord(value) || value.version !== 1) return null;
  if (domain === "school") {
    if (!hasArrays(value, ["terms", "courses", "assignments", "grades", "goals", "resources"]) || !allHaveStringId(value.terms) || !allHaveStringId(value.courses) || !allHaveStringId(value.assignments) || !allHaveStringId(value.goals) || !allHaveStringId(value.resources) || !(value.grades as unknown[]).every((item) => isRecord(item) && typeof item.courseId === "string")) return null;
    return { version: 1, terms: value.terms, courses: value.courses, assignments: value.assignments, grades: value.grades, goals: value.goals, resources: value.resources } as DomainSnapshots[typeof domain];
  }
  if (domain === "garage") {
    const keys = ["vehicles", "maintenance", "services", "issues", "modifications", "expenses", "reminders", "mileageHistory"];
    if (!hasArrays(value, keys) || !keys.every((key) => allHaveStringId(value[key]))) return null;
    return { version: 1, ...(typeof value.selectedVehicleId === "string" ? { selectedVehicleId: value.selectedVehicleId } : {}), vehicles: value.vehicles, maintenance: value.maintenance, services: value.services, issues: value.issues, modifications: value.modifications, expenses: value.expenses, reminders: value.reminders, mileageHistory: value.mileageHistory } as DomainSnapshots[typeof domain];
  }
  if (domain === "projects") {
    if (!hasArrays(value, ["projects", "tasks", "milestones"]) || !allHaveStringId(value.projects) || !allHaveStringId(value.tasks) || !allHaveStringId(value.milestones)) return null;
    return { version: 1, ...(typeof value.selectedProjectId === "string" ? { selectedProjectId: value.selectedProjectId } : {}), projects: value.projects, tasks: value.tasks, milestones: value.milestones } as DomainSnapshots[typeof domain];
  }
  if (domain === "notes") {
    if (!Array.isArray(value.notes) || !value.notes.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.body === "string")) return null;
    return { version: 1, notes: value.notes } as DomainSnapshots[typeof domain];
  }
  if (domain === "clock") {
    if (!hasArrays(value, ["worldClocks", "alarms", "timers", "timerPresets"]) || !allHaveStringId(value.worldClocks) || !allHaveStringId(value.alarms) || !allHaveStringId(value.timers) || !allHaveStringId(value.timerPresets) || !isRecord(value.preferences) || !isRecord(value.stopwatch) || !Array.isArray(value.stopwatch.laps) || (value.preferences.hourFormat !== "system" && value.preferences.hourFormat !== "12" && value.preferences.hourFormat !== "24")) return null;
    return { version: 1, preferences: { hourFormat: value.preferences.hourFormat }, worldClocks: value.worldClocks, alarms: value.alarms, timers: value.timers, timerPresets: value.timerPresets, stopwatch: value.stopwatch } as unknown as DomainSnapshots[typeof domain];
  }
  if (!Array.isArray(value.searches) || !value.searches.every((item) => isRecord(item) && typeof item.query === "string" && typeof item.searchedAt === "number")) return null;
  return { version: 1, searches: value.searches.slice(0, 10).map((item) => ({ query: item.query, searchedAt: item.searchedAt })) } as DomainSnapshots[typeof domain];
}

function snapshotAll(): DomainSnapshots {
  return {
    settings: readSettingsSnapshot(),
    school: readSchoolSnapshot(),
    garage: readGarageSnapshot(),
    projects: readProjectsSnapshot(),
    notes: readNotesSnapshot(),
    clock: readClockSnapshot(),
    search: { version: 1, searches: readRecentSearches() },
  };
}

const writers: { [K in CosmicBackupDomain]: (data: DomainSnapshots[K]) => void } = {
  settings: replaceSettingsSnapshot,
  school: (data) => replaceSchoolSnapshot(data as Parameters<typeof replaceSchoolSnapshot>[0]),
  garage: replaceGarageSnapshot,
  projects: replaceProjectsSnapshot,
  notes: replaceNotesSnapshot,
  clock: replaceClockSnapshot,
  search: replaceRecentSearches,
};

const emptySnapshots: DomainSnapshots = {
  settings: defaultSettingsData,
  school: emptySchoolData,
  garage: emptyGarageData,
  projects: emptyProjectsData,
  notes: emptyNotesData,
  clock: defaultClockData,
  search: { version: 1, searches: [] },
};

function countDomain(domain: CosmicBackupDomain, value: DomainSnapshots[typeof domain]): number {
  if (domain === "settings") return 1;
  if (!isRecord(value)) return 0;
  return Object.values(value).reduce<number>((total, item) => total + (Array.isArray(item) ? item.length : 0), 0);
}

export function createCosmicBackup(): CosmicLocalBackup {
  return {
    format: "cosmic-local-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: COSMIC_APP_VERSION,
    domains: snapshotAll(),
  };
}

export function downloadCosmicBackup() {
  const backup = createCosmicBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cosmic-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function parseCosmicBackup(raw: string): BackupPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!isRecord(parsed) || parsed.format !== "cosmic-local-backup" || parsed.version !== 1 || typeof parsed.exportedAt !== "string" || !Number.isFinite(Date.parse(parsed.exportedAt)) || typeof parsed.appVersion !== "string" || !isRecord(parsed.domains)) {
    throw new Error("This is not a supported Cosmic backup.");
  }

  const domainKeys = Object.keys(parsed.domains);
  if (!domainKeys.length || domainKeys.some((key) => !backupDomains.includes(key as CosmicBackupDomain))) {
    throw new Error("The backup contains unsupported data domains.");
  }

  const domains: Partial<DomainSnapshots> = {};
  const counts = Object.fromEntries(backupDomains.map((domain) => [domain, 0])) as Record<CosmicBackupDomain, number>;
  for (const domain of domainKeys as CosmicBackupDomain[]) {
    const value = validateDomain(domain, parsed.domains[domain]);
    if (!value) throw new Error(`The ${domain} domain is invalid or uses an unsupported version.`);
    (domains as Record<string, unknown>)[domain] = value;
    counts[domain] = countDomain(domain, value);
  }

  return {
    backup: { format: "cosmic-local-backup", version: 1, exportedAt: parsed.exportedAt, appVersion: parsed.appVersion, domains },
    counts,
    domains: domainKeys as CosmicBackupDomain[],
  };
}

export function importCosmicBackup(preview: BackupPreview) {
  const before = snapshotAll();
  const written: CosmicBackupDomain[] = [];
  try {
    for (const domain of preview.domains) {
      const value = preview.backup.domains[domain];
      const validated = validateDomain(domain, value);
      if (!validated) throw new Error(`The ${domain} domain failed final validation.`);
      (writers[domain] as (data: typeof validated) => void)(validated);
      written.push(domain);
    }
  } catch (error) {
    for (const domain of written.reverse()) {
      (writers[domain] as (data: DomainSnapshots[typeof domain]) => void)(before[domain]);
    }
    throw error;
  }
}

export function resetCosmicDomain(domain: CosmicBackupDomain) {
  if (domain === "search") {
    clearRecentSearches();
    return;
  }
  (writers[domain] as (data: DomainSnapshots[typeof domain]) => void)(emptySnapshots[domain]);
}

export function resetAllCosmicLocalData() {
  for (const domain of backupDomains) resetCosmicDomain(domain);
}

export function getLocalDataCounts() {
  const values = snapshotAll();
  return Object.fromEntries(backupDomains.map((domain) => [domain, countDomain(domain, values[domain])])) as Record<CosmicBackupDomain, number>;
}
