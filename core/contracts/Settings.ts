import type { ClockLocalData } from "./Clock";
import type { GarageLocalData } from "./Garage";
import type { NotesLocalData } from "./Notes";
import type { ProjectsLocalData } from "./Projects";
import type { FinanceSnapshot } from "./Finance";
import type { DeviceProfileOverride, PerformanceMode } from "./System";
import type { SportKind } from "./Sports";

export type BackgroundIntensity = "low" | "normal" | "high";
export type BackgroundMotion = "off" | "subtle" | "normal";
export type AmbientIdleMinutes = 1 | 2 | 5 | 10 | 15 | 30 | null;

export interface SportsFollowedTeam {
  sport: Extract<SportKind, "mlb" | "nfl" | "nba" | "mls" | "college-football">;
  provider: "mlb" | "espn" | "pending";
  teamId: string;
  label: string;
}

export interface SportsFollowedDriver {
  id: string;
  label: string;
  sport?: "f1" | "nascar";
}

export interface SportsFollowedConstructor {
  id: string;
  label: string;
  sport?: "f1";
}

export interface SportsNotificationPreferences {
  gameStartingSoon: boolean;
  gameStarted: boolean;
  scoreChange: boolean;
  closeGameLate: boolean;
  finalResult: boolean;
  qualifyingStartingSoon: boolean;
  raceStartingSoon: boolean;
  followedResult: boolean;
}

export interface GarageNotificationPreferences {
  maintenanceDueSoon: boolean;
  maintenanceOverdue: boolean;
  criticalIssueReminder: boolean;
  vehicleReminderDue: boolean;
  diagnosticCodeDetected: boolean;
  connectedVehicleNeedsAttention: boolean;
}

export interface CosmicUserPreferences {
  version: 1;
  sports: {
    enabledSports: SportKind[];
    followedTeams: SportsFollowedTeam[];
    followedDrivers: SportsFollowedDriver[];
    followedConstructors: SportsFollowedConstructor[];
    notifications: SportsNotificationPreferences;
  };
  garage?: { notifications: GarageNotificationPreferences };
  dashboard: {
    visibleWidgets: string[];
    widgetOrder: string[];
    widgetSizes: Record<string, "small" | "medium" | "large">;
    contextDensity: "sparse" | "balanced" | "full";
  };
  modules: Record<"sports" | "finance" | "school" | "garage" | "mail" | "calendar" | "projects" | "notes", boolean>;
  context: {
    enabledSources: string[];
    suppressedKinds: string[];
  };
}

export type CosmicProfileId = "neutral" | "reference" | "sports-heavy" | "student" | "minimal";

export interface CosmicSettingsLocalData {
  version: 1;
  profileId: CosmicProfileId;
  preferences: CosmicUserPreferences;
  profiles?: Partial<Record<CosmicProfileId, CosmicUserPreferences>>;
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
