"use client";

export type CosmicSyncDomain = "settings" | "notes" | "projects" | "finance" | "garage" | "school";
export type CosmicSyncStatus = "local-only" | "synced" | "syncing" | "offline" | "error" | "conflict";

export interface SyncMetadata {
  domain: CosmicSyncDomain;
  revision: number;
  lastSyncedAt?: string;
  status: CosmicSyncStatus;
  error?: string;
}

export interface SyncDiagnostic extends SyncMetadata {
  scopeId: string;
  pending: boolean;
}
