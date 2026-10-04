"use client";

import { useCallback, useEffect, useState } from "react";
import type { SportKind, SportsEvent, SportsEventStatus, SportsSnapshot } from "@/core/contracts/Sports";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { useCosmicScope } from "@/services/storage/scope";
import { kioskApiUrl } from "@/services/kioskRequest";
import { sceneRefreshDiagnostics, sportsRefreshMode, sportsRefreshMs } from "@/services/kiosk/refreshPolicy";
import { useConnectionHealth } from "@/services/kiosk/ConnectionHealthProvider";

type SportsHookOptions = { sport?: SportKind; kioskEligibility?: boolean; refreshMs?: number | ((snapshot: SportsSnapshot | null) => number); enabled?: boolean };
type SportsWireEvent = Omit<SportsEvent, "start" | "end"> & { start: string; end?: string };
type SportsWireSnapshot = Omit<SportsSnapshot, "live" | "upcoming" | "recent" | "featured" | "lastUpdated"> & {
  live: SportsWireEvent[];
  upcoming: SportsWireEvent[];
  recent: SportsWireEvent[];
  featured: SportsWireEvent[];
  lastUpdated: string;
};

const pendingRequests = new Map<string, Promise<SportsSnapshot>>();
const snapshotCache = new Map<string, { expiresAt: number; value: SportsSnapshot }>();

function cachedSnapshot(key: string) {
  const entry = snapshotCache.get(key);
  return entry && entry.expiresAt > Date.now() ? entry.value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSportKind(value: string): value is SportKind {
  return value === "mlb" || value === "nfl" || value === "nba" || value === "mls" || value === "f1" || value === "nascar" || value === "college-football";
}

function isStatus(value: string): value is SportsEventStatus {
  return ["scheduled", "pregame", "live", "delayed", "final", "postponed", "cancelled"].includes(value);
}

function hydrateEvent({ start, end, ...event }: SportsWireEvent): SportsEvent {
  return { ...event, start: new Date(start), ...(end ? { end: new Date(end) } : {}) };
}

function hydrateSnapshot(snapshot: SportsWireSnapshot): SportsSnapshot {
  return {
    ...snapshot,
    live: snapshot.live.map(hydrateEvent),
    upcoming: snapshot.upcoming.map(hydrateEvent),
    recent: snapshot.recent.map(hydrateEvent),
    featured: snapshot.featured.map(hydrateEvent),
    lastUpdated: new Date(snapshot.lastUpdated),
  };
}

function isWireEvent(value: unknown): value is SportsWireEvent {
  if (!isRecord(value)) return false;
  const event = value;
  return typeof event.id === "string" && typeof event.title === "string" && typeof event.start === "string" && typeof event.sport === "string" && isSportKind(event.sport) && typeof event.status === "string" && isStatus(event.status);
}

function isWireSnapshot(value: unknown): value is SportsWireSnapshot {
  if (!isRecord(value)) return false;
  const snapshot = value;
  return typeof snapshot.lastUpdated === "string"
    && isRecord(snapshot.standings)
    && Array.isArray(snapshot.providerErrors)
    && Array.isArray(snapshot.sources)
    && [snapshot.live, snapshot.upcoming, snapshot.recent, snapshot.featured].every((items) => Array.isArray(items) && items.every(isWireEvent));
}

async function requestSnapshot(sport: SportKind | undefined, scopeId: string, kioskEligibility: boolean): Promise<SportsSnapshot> {
  const key = `${scopeId}:${sport ?? "all"}:${kioskEligibility ? "kiosk" : "all"}`;
  const cached = snapshotCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const pendingRequest = pendingRequests.get(key);
  if (pendingRequest) return pendingRequest;
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (kioskEligibility) params.set("kiosk", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  const request = fetch(kioskApiUrl(`/api/sports${query}`), { credentials: "include", cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Sports data is temporarily unavailable.");
      const payload: unknown = await response.json();
      if (!isWireSnapshot(payload)) throw new Error("Sports response was invalid.");
      const snapshot = hydrateSnapshot(payload);
      const refreshMs = sportsRefreshMs(snapshot);
      snapshotCache.set(key, { value: snapshot, expiresAt: Date.now() + refreshMs });
      return snapshot;
    })
    .finally(() => { pendingRequests.delete(key); });
  pendingRequests.set(key, request);
  return request;
}

export function useSports(options: SportsHookOptions = {}) {
  const { sport, kioskEligibility = false, refreshMs = (snapshot) => sportsRefreshMs(snapshot), enabled = true } = options;
  const scope = useCosmicScope();
  const { recordAttempt, recordSuccess, recordFailure } = useConnectionHealth();
  const cacheKey = `${scope.id}:${sport ?? "all"}:${kioskEligibility ? "kiosk" : "all"}`;
  const [data, setData] = useState<SportsSnapshot | null>(() => cachedSnapshot(cacheKey));
  const [loading, setLoading] = useState(() => !cachedSnapshot(cacheKey));
  const [error, setError] = useState<string | null>(null);
  const [lastSuccessfulRefreshAt, setLastSuccessfulRefreshAt] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      recordAttempt("sports");
      setError(null);
      setData(await requestSnapshot(sport, scope.id, kioskEligibility));
      setLastSuccessfulRefreshAt(new Date().toISOString());
      recordSuccess("sports");
    } catch (reason) {
      recordFailure("sports", "provider-error");
      setError(reason instanceof Error ? reason.message : "Sports data is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [kioskEligibility, recordAttempt, recordFailure, recordSuccess, scope.id, sport]);
  useEffect(() => { const timer = window.setTimeout(() => { const next = cachedSnapshot(cacheKey); setData(next); setLoading(!next); setError(null); setLastSuccessfulRefreshAt(next ? next.lastUpdated.toISOString() : undefined); }, 0); return () => window.clearTimeout(timer); }, [cacheKey]);
  useEffect(() => {
    const invalidate = () => {
      for (const key of snapshotCache.keys()) if (key.startsWith(`${scope.id}:`)) snapshotCache.delete(key);
    };
    window.addEventListener("cosmic:settings-local-data-updated", invalidate);
    return () => window.removeEventListener("cosmic:settings-local-data-updated", invalidate);
  }, [scope.id]);

  const intervalMs = typeof refreshMs === "function" ? refreshMs(data) : refreshMs;
  useVisiblePolling(refresh, intervalMs, { enabled, immediate: data === null });

  return { data, loading, error, refresh, refreshDiagnostics: sceneRefreshDiagnostics(lastSuccessfulRefreshAt, intervalMs, sportsRefreshMode(data)) };
}
