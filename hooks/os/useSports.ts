"use client";

import { useCallback, useEffect, useState } from "react";
import type { SportKind, SportsEvent, SportsEventStatus, SportsSnapshot } from "@/core/contracts/Sports";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { useCosmicScope } from "@/services/storage/scope";

type SportsHookOptions = { sport?: SportKind; refreshMs?: number | ((snapshot: SportsSnapshot | null) => number) };
type SportsWireEvent = Omit<SportsEvent, "start" | "end"> & { start: string; end?: string };
type SportsWireSnapshot = Omit<SportsSnapshot, "live" | "upcoming" | "recent" | "featured" | "lastUpdated"> & {
  live: SportsWireEvent[];
  upcoming: SportsWireEvent[];
  recent: SportsWireEvent[];
  featured: SportsWireEvent[];
  lastUpdated: string;
};

const pendingRequests = new Map<string, Promise<SportsSnapshot>>();

function sportsRefreshMs(snapshot: SportsSnapshot | null): number {
  if (!snapshot) return 15_000;
  if (snapshot.live.length) return 15_000;
  if (snapshot.upcoming.length) return 60_000;
  return 5 * 60_000;
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

async function requestSnapshot(sport: SportKind | undefined, scopeId: string): Promise<SportsSnapshot> {
  const key = `${scopeId}:${sport ?? "all"}`;
  const pendingRequest = pendingRequests.get(key);
  if (pendingRequest) return pendingRequest;
  const query = sport ? `?sport=${encodeURIComponent(sport)}` : "";
  const request = fetch(`/api/sports${query}`, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Sports data is temporarily unavailable.");
      const payload: unknown = await response.json();
      if (!isWireSnapshot(payload)) throw new Error("Sports response was invalid.");
      return hydrateSnapshot(payload);
    })
    .finally(() => { pendingRequests.delete(key); });
  pendingRequests.set(key, request);
  return request;
}

export function useSports(options: SportsHookOptions = {}) {
  const { sport, refreshMs = sportsRefreshMs } = options;
  const scope = useCosmicScope();
  const [data, setData] = useState<SportsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setData(await requestSnapshot(sport, scope.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sports data is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [sport, scope.id]);
  useEffect(() => { const timer = window.setTimeout(() => { setData(null); setLoading(true); setError(null); }, 0); return () => window.clearTimeout(timer); }, [scope.id]);

  const intervalMs = typeof refreshMs === "function" ? refreshMs(data) : refreshMs;
  useVisiblePolling(refresh, intervalMs, { immediate: data === null });

  return { data, loading, error, refresh };
}
