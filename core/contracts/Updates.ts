export type CosmicUpdateState = "up-to-date" | "available" | "applying" | "restarting" | "failed";

export interface CosmicUpdateStatus {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  checkedAt: string;
  state: CosmicUpdateState;
}

export type PiUpdateState = "idle" | "checking" | "available" | "applying" | "success" | "failed" | "reboot-required";

export interface PiUpdateStatus {
  checkedAt?: string;
  updatesAvailable?: number;
  securityUpdates?: number;
  rebootRequired?: boolean;
  state: PiUpdateState;
  lastSuccessfulUpdate?: string;
  lastFailureCategory?: string;
}
