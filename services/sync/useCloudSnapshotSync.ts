"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CosmicDataScope } from "@/services/storage/scope";
import { pullCloudSnapshot, pushCloudSnapshot, readSyncMetadata, writeSyncMetadata } from "./client";
import type { CosmicSyncDomain, CosmicSyncStatus, SyncMetadata } from "./contracts";

export function useCloudSnapshotSync<T>({ domain, scope, ready, data, setData, equals }: { domain: CosmicSyncDomain; scope: CosmicDataScope; ready: boolean; data: T; setData: (value: T) => void; equals(left: T, right: T): boolean }) {
  const scopeId = scope.id;
  const scopeKind = scope.kind;
  const syncScope = useMemo(() => ({ id: scopeId, kind: scopeKind }) satisfies CosmicDataScope, [scopeId, scopeKind]);
  const [metadata, setMetadata] = useState<SyncMetadata>(() => readSyncMetadata(scope, domain));
  const [cloudReady, setCloudReady] = useState(false);
  const skipNextPush = useRef(true);
  const setStatus = useCallback((status: CosmicSyncStatus, extra: Partial<SyncMetadata> = {}) => { const next = { ...readSyncMetadata(syncScope, domain), ...extra, domain, status }; setMetadata(next); writeSyncMetadata(syncScope, next); }, [domain, syncScope]);

  useEffect(() => { const timer = window.setTimeout(() => { setCloudReady(false); skipNextPush.current = true; setMetadata(readSyncMetadata(syncScope, domain)); }, 0); return () => window.clearTimeout(timer); }, [domain, syncScope]);
  useEffect(() => {
    if (!ready || scopeKind !== "account") { if (!ready) return; const timer = window.setTimeout(() => setCloudReady(true), 0); return () => window.clearTimeout(timer); }
    let cancelled = false;
    void pullCloudSnapshot<T>(domain).then((remote) => { if (cancelled) return; if (remote?.snapshot != null && !equals(data, remote.snapshot)) setData(remote.snapshot); const next = { ...readSyncMetadata(syncScope, domain), revision: remote?.revision ?? 0, lastSyncedAt: new Date().toISOString(), status: remote?.initialized ? "synced" as const : "local-only" as const, error: undefined }; setMetadata(next); writeSyncMetadata(syncScope, next); skipNextPush.current = true; setCloudReady(true); }).catch((error: unknown) => { if (cancelled) return; setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error", { error: error instanceof Error ? error.message : "Cloud sync failed." }); skipNextPush.current = true; setCloudReady(true); });
    return () => { cancelled = true; };
  // data is deliberately excluded: this effect is the one-time pull for the loaded scope.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, ready, scopeId, scopeKind, setData, setStatus, syncScope]);
  useEffect(() => {
    if (!cloudReady || !ready || scopeKind !== "account") return;
    if (skipNextPush.current) { skipNextPush.current = false; return; }
    const timer = window.setTimeout(() => { const current = readSyncMetadata(syncScope, domain); setStatus("syncing", { error: undefined }); void pushCloudSnapshot(domain, data, current.revision).then((result) => { if (result.conflict) { setData(result.snapshot); setStatus("conflict", { revision: result.revision, error: "A newer cloud version was found." }); return; } setStatus("synced", { revision: result.revision, lastSyncedAt: new Date().toISOString(), error: undefined }); }).catch((error: unknown) => setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error", { error: error instanceof Error ? error.message : "Cloud sync failed." })); }, 500);
    return () => window.clearTimeout(timer);
  }, [cloudReady, data, domain, ready, scopeId, scopeKind, setData, setStatus, syncScope]);
  return metadata;
}
