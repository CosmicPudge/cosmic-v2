import type { SportsSnapshot } from "@/core/contracts/Sports";
import { KIOSK_KICKOFF_GRACE_MS } from "@/services/sports/preferences";

export type KioskRefreshMode = "idle" | "active" | "near-live" | "live";

export const KIOSK_REFRESH_MS = {
  musicActive: 500,
  musicPaused: 3_000,
  musicIdle: 10_000,
  sportsLive: 10_000,
  sportsNearLive: 20_000,
  sportsIdle: 5 * 60_000,
  weatherCurrent: 45_000,
  weatherForecast: 5 * 60_000,
  calendar: 30_000,
  school: 90_000,
} as const;

export function musicRefreshMs(active: boolean, playing: boolean) {
  if (playing) return KIOSK_REFRESH_MS.musicActive;
  return active ? KIOSK_REFRESH_MS.musicPaused : KIOSK_REFRESH_MS.musicIdle;
}

export function musicBackoffMs(failureCount: number, retryAfterMs?: number) {
  if (retryAfterMs !== undefined && Number.isFinite(retryAfterMs)) return Math.min(60_000, Math.max(2_000, retryAfterMs));
  return Math.min(60_000, 2_000 * 2 ** Math.max(0, Math.min(5, failureCount - 1)));
}

export function sportsRefreshMode(snapshot: SportsSnapshot | null, now = new Date()): KioskRefreshMode {
  if (!snapshot) return "active";
  if (snapshot.live.length > 0) return "live";
  const nearLive = snapshot.upcoming.some((event) => {
    if (["delayed", "suspended"].includes(event.status)) return true;
    if (!["scheduled", "pregame"].includes(event.status)) return false;
    const untilStart = event.start.getTime() - now.getTime();
    return (untilStart >= 0 && untilStart <= 60 * 60_000) || (untilStart < 0 && untilStart >= -KIOSK_KICKOFF_GRACE_MS);
  });
  return nearLive ? "near-live" : "idle";
}

export function sportsRefreshMs(snapshot: SportsSnapshot | null, now = new Date()) {
  switch (sportsRefreshMode(snapshot, now)) {
    case "live": return KIOSK_REFRESH_MS.sportsLive;
    case "near-live": return KIOSK_REFRESH_MS.sportsNearLive;
    default: return KIOSK_REFRESH_MS.sportsIdle;
  }
}

export function sceneRefreshDiagnostics(lastSuccessfulRefreshAt?: string, refreshMs: number = KIOSK_REFRESH_MS.school, mode: KioskRefreshMode = "active") {
  const last = lastSuccessfulRefreshAt ? Date.parse(lastSuccessfulRefreshAt) : NaN;
  return { effectiveRefreshMs: refreshMs, lastSuccessfulRefreshAt, staleAgeMs: Number.isFinite(last) ? Math.max(0, Date.now() - last) : undefined, refreshMode: mode };
}
