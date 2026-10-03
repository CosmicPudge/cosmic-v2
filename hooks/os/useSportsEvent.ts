"use client";

import { useCallback, useState } from "react";
import type { SportsEvent, SportsEventStatus } from "@/core/contracts/Sports";
import type { SportsLiveData } from "@/core/contracts/sports/Core";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { kioskApiUrl } from "@/services/kioskRequest";
import { sportsDetailPresence } from "@/services/sports/detailDiagnostics";

interface WireResponse { event: Omit<SportsEvent, "start" | "end"> & { start: string; end?: string }; live: SportsLiveData | null; lastUpdated: string; providerErrors: unknown[]; }
function hydrate(value: WireResponse) { const { start, end, ...event } = value.event; return { ...value, event: { ...event, start: new Date(start), ...(end ? { end: new Date(end) } : {}) } }; }
function detailLogAllowed() { if (typeof window === "undefined") return false; return window.location.hostname === "dev.cosmicpudge.shop" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"; }

export function useSportsEvent(eventId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<ReturnType<typeof hydrate> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    const diagnostics = detailLogAllowed();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} request=started attempt=${attempt}`);
      const response = await fetch(kioskApiUrl(`/api/sports/event/${encodeURIComponent(eventId)}`), { credentials: "include", cache: "no-store" });
      if (!response.ok && (response.status === 401 || response.status === 403) && attempt < 3) {
        if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} status=${response.status} reason=authentication_required retry=true`);
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        continue;
      }
      if (!response.ok) {
        if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} status=${response.status} success=false reason=${response.status === 401 || response.status === 403 ? "authentication_required" : response.status === 404 ? "not_found" : "request_failed"}`);
        throw new Error(response.status === 404 ? "This Sports event could not be found." : "Sports event data is unavailable.");
      }
      const hydrated = hydrate(await response.json() as WireResponse);
      if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} status=${response.status} detail=${Boolean(hydrated.live)} ${Object.entries(sportsDetailPresence(hydrated.live)).filter(([key]) => key !== "detail").map(([key, value]) => `${key}=${value}`).join(" ")}`);
      setData(hydrated);
      setError(null);
      setLoading(false);
      return;
    }
  }, [eventId]);
  const status: SportsEventStatus | undefined = data?.event.status;
  const polling = status === undefined || status === "live" || status === "delayed" ? 2_000 : status === "pregame" ? 15_000 : 60_000;
  useVisiblePolling(async () => { try { await refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Sports event data is unavailable."); setLoading(false); } }, polling, { immediate: true, enabled: enabled && status !== "final" && status !== "cancelled" && status !== "postponed" });
  return { data, loading, error, refresh };
}
