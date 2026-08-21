import type { ClockLocalData } from "./Clock";
import type { GarageLocalData } from "./Garage";
import type { NotesLocalData } from "./Notes";
import type { ProjectsLocalData } from "./Projects";
import type { FinanceSnapshot } from "./Finance";
import type { DeviceProfileOverride, PerformanceMode } from "./System";

export type BackgroundIntensity = "low" | "normal" | "high";
export type BackgroundMotion = "off" | "subtle" | "normal";
export type AmbientIdleMinutes = 1 | 2 | 5 | 10 | 15 | 30 | null;

export interface CosmicSettingsLocalData {
  version: 1;
  appearance: {
    reducedEffects: boolean;
  };
  background: {
    intensity: BackgroundIntensity;
    motion: BackgroundMotion;
  };
  ambient: {
    enabled: boolean;
    idleMinutes: AmbientIdleMinutes;
  };
  system: {
    performanceMode: PerformanceMode;
    deviceProfileOverride: DeviceProfileOverride;
  };
}

export interface SchoolBackupData {
  version: 1;
  terms: unknown[];
  courses: unknown[];
  assignments: unknown[];
  grades: unknown[];
  goals: unknown[];
  resources: unknown[];
}

export interface SearchBackupData {
  version: 1;
  searches: Array<{ query: string; searchedAt: number }>;
}

export interface CosmicLocalBackupDomains {
  settings: CosmicSettingsLocalData;
  school: SchoolBackupData;
  garage: GarageLocalData;
  projects: ProjectsLocalData;
  notes: NotesLocalData;
  clock: ClockLocalData;
  search: SearchBackupData;
  finance: FinanceSnapshot;
}

export type CosmicBackupDomain = keyof CosmicLocalBackupDomains;

export interface CosmicLocalBackup {
  format: "cosmic-local-backup";
  version: 1;
  exportedAt: string;
  appVersion: string;
  domains: Partial<CosmicLocalBackupDomains>;
}

export interface BackupPreview {
  backup: CosmicLocalBackup;
  counts: Record<CosmicBackupDomain, number>;
  domains: CosmicBackupDomain[];
}
