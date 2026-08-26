"use client";

import { useCallback, useState } from "react";
import type { SportsEvent, SportsEventStatus } from "@/core/contracts/Sports";
import type { SportsLiveData } from "@/core/contracts/sports/Core";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";

interface WireResponse { event: Omit<SportsEvent, "start" | "end"> & { start: string; end?: string }; live: SportsLiveData | null; lastUpdated: string; providerErrors: unknown[]; }
function hydrate(value: WireResponse) { const { start, end, ...event } = value.event; return { ...value, event: { ...event, start: new Date(start), ...(end ? { end: new Date(end) } : {}) } }; }

export function useSportsEvent(eventId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<ReturnType<typeof hydrate> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/sports/event/${encodeURIComponent(eventId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 404 ? "This Sports event could not be found." : "Sports event data is unavailable.");
    setData(hydrate(await response.json() as WireResponse));
    setError(null);
    setLoading(false);
  }, [eventId]);
  const status: SportsEventStatus | undefined = data?.event.status;
  const polling = status === undefined || status === "live" || status === "delayed" ? 2_000 : status === "pregame" ? 15_000 : 60_000;
  useVisiblePolling(async () => { try { await refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Sports event data is unavailable."); setLoading(false); } }, polling, { immediate: true, enabled: enabled && status !== "final" && status !== "cancelled" && status !== "postponed" });
  return { data, loading, error, refresh };
}
