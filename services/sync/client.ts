"use client";

import type { CosmicDataScope } from "@/services/storage/scope";
import type { CosmicSyncDomain, SyncMetadata } from "./contracts";

function metadataKey(scopeId: string, domain: CosmicSyncDomain) { return `cosmic.sync.${scopeId}.${domain}`; }
export function readSyncMetadata(scope: CosmicDataScope, domain: CosmicSyncDomain): SyncMetadata { try { const value = JSON.parse(window.localStorage.getItem(metadataKey(scope.id, domain)) ?? "null") as Partial<SyncMetadata> | null; return { domain, revision: typeof value?.revision === "number" ? value.revision : 0, ...(typeof value?.lastSyncedAt === "string" ? { lastSyncedAt: value.lastSyncedAt } : {}), status: value?.status ?? (scope.kind === "account" ? "local-only" : "local-only"), ...(value?.error ? { error: value.error } : {}) }; } catch { return { domain, revision: 0, status: "local-only" }; } }
export function writeSyncMetadata(scope: CosmicDataScope, metadata: SyncMetadata) { window.localStorage.setItem(metadataKey(scope.id, metadata.domain), JSON.stringify(metadata)); window.dispatchEvent(new CustomEvent("cosmic:sync-updated", { detail: metadata })); }

export async function pullCloudSnapshot<T>(domain: CosmicSyncDomain): Promise<{ snapshot?: T | null; revision: number; initialized: boolean } | null> {
  const response = await fetch(`/api/account/sync/${domain}`, { cache: "no-store" });
  if (response.status === 404) return { snapshot: null, revision: 0, initialized: false };
  if (!response.ok) throw new Error(response.status === 503 ? "Cloud sync is unavailable." : "Cloud sync could not load this domain.");
  return await response.json() as { snapshot?: T | null; revision: number; initialized: boolean };
}

export async function pushCloudSnapshot<T>(domain: CosmicSyncDomain, snapshot: T, expectedRevision: number) {
  const response = await fetch(`/api/account/sync/${domain}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshot, expectedRevision }) });
  const payload = await response.json() as { snapshot?: T; revision?: number; error?: string };
  if (response.status === 409 && payload.snapshot && typeof payload.revision === "number") return { conflict: true as const, snapshot: payload.snapshot, revision: payload.revision };
  if (!response.ok || typeof payload.revision !== "number") throw new Error(payload.error ?? "Cloud sync could not save this domain.");
  return { conflict: false as const, revision: payload.revision };
}
