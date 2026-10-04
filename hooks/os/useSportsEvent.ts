"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SportsEvent, SportsEventStatus } from "@/core/contracts/Sports";
import type { SportsLiveData } from "@/core/contracts/sports/Core";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { kioskApiUrl } from "@/services/kioskRequest";
import { sportsDetailPresence } from "@/services/sports/detailDiagnostics";
import { diffFootballState, hasFootballStateChange } from "@/services/sports/football/stateDiff";

interface WireResponse { event: Omit<SportsEvent, "start" | "end"> & { start: string; end?: string }; live: SportsLiveData | null; lastUpdated: string; providerErrors: unknown[]; }
function hydrate(value: WireResponse) { const { start, end, ...event } = value.event; return { ...value, event: { ...event, start: new Date(start), ...(end ? { end: new Date(end) } : {}) } }; }
function detailLogAllowed() { if (typeof window === "undefined") return false; return window.location.hostname === "dev.cosmicpudge.shop" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"; }

export function useSportsEvent(eventId: string, options: { enabled?: boolean; sport?: string } = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<ReturnType<typeof hydrate> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorEvent, setErrorEvent] = useState<string | null>(null);
  const dataRef = useRef<ReturnType<typeof hydrate> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    controllerRef.current?.abort();
    dataRef.current = null;
  }, [eventId]);
  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const diagnostics = detailLogAllowed();
    const startedAt = performance.now();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      if (controller.signal.aborted) return;
      if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} request=started attempt=${attempt}`);
      const response = await fetch(kioskApiUrl(`/api/sports/event/${encodeURIComponent(eventId)}`), { credentials: "include", cache: "no-store", signal: controller.signal });
      if (!response.ok && (response.status === 401 || response.status === 403) && attempt < 3) {
        if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} status=${response.status} reason=authentication_required retry=true`);
        await new Promise((resolve, reject) => { const timer = window.setTimeout(resolve, 500); controller.signal.addEventListener("abort", () => { window.clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true }); });
        continue;
      }
      if (!response.ok) {
        if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} status=${response.status} success=false reason=${response.status === 401 || response.status === 403 ? "authentication_required" : response.status === 404 ? "not_found" : "request_failed"}`);
        throw new Error(response.status === 404 ? "This Sports event could not be found." : "Sports event data is unavailable.");
      }
      const hydrated = hydrate(await response.json() as WireResponse);
      if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} status=${response.status} detail=${Boolean(hydrated.live)} ${Object.entries(sportsDetailPresence(hydrated.live)).filter(([key]) => key !== "detail").map(([key, value]) => `${key}=${value}`).join(" ")}`);
      const previous = dataRef.current;
      const footballResponse = options.sport === "nfl" || options.sport === "college-football";
      const delta = footballResponse ? diffFootballState(previous?.live as Parameters<typeof diffFootballState>[0], hydrated.live as Parameters<typeof diffFootballState>[1]) : undefined;
      const changed = !previous || !footballResponse || previous.event.id !== hydrated.event.id || Boolean(delta && hasFootballStateChange(delta));
      dataRef.current = hydrated;
      if (diagnostics && footballResponse) console.info(`[kiosk-sports-detail] event=${eventId} durationMs=${Math.round(performance.now() - startedAt)} stateChanged=${changed} changedFields=${delta ? Object.entries(delta).filter(([, value]) => value).map(([key]) => key).join(",") || "none" : "unknown"}`);
      if (changed) setData(hydrated);
      setErrorEvent(eventId);
      setError(null);
      setLoading(false);
      return;
    }
  }, [eventId, options.sport]);
  useEffect(() => () => controllerRef.current?.abort(), [eventId]);
  const status: SportsEventStatus | undefined = data?.event.status;
  const football = options.sport === "nfl" || options.sport === "college-football";
  const polling = status === undefined || status === "live" || status === "delayed" || status === "suspended" || (football && (status === "scheduled" || status === "pregame")) ? 10_000 : 60_000;
  useVisiblePolling(async () => { try { await refresh(); } catch (reason) { if (reason instanceof DOMException && reason.name === "AbortError") return; setErrorEvent(eventId); setError(reason instanceof Error ? reason.message : "Sports event data is unavailable."); setLoading(false); } }, polling, { immediate: true, enabled: enabled && status !== "final" && status !== "cancelled" && status !== "postponed" });
  return { data: data?.event.id === eventId ? data : null, loading: loading || data?.event.id !== eventId, error: errorEvent === eventId ? error : null, refresh };
}
