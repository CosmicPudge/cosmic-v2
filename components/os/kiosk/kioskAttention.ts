import type { SportsEvent } from "@/core/contracts/Sports";
import { normalizeKioskSportsEvent } from "@/services/sports/kioskSelection";

export const KIOSK_PRE_EVENT_THRESHOLDS_MINUTES = [5, 10, 15] as const;
export type KioskPreEventThreshold = (typeof KIOSK_PRE_EVENT_THRESHOLDS_MINUTES)[number];

export interface KioskPreEventAlert {
  event: SportsEvent;
  thresholdMinutes: KioskPreEventThreshold;
  key: string;
}

export function selectKioskPreEventAlert(
  events: SportsEvent[],
  now = new Date(),
  firedKeys = new Set<string>(),
): KioskPreEventAlert | null {
  const next = events
    .map((event) => ({ event, normalized: normalizeKioskSportsEvent(event, now) }))
    .filter(({ normalized }) => Boolean(normalized && !normalized.live && normalized.startTime.getTime() >= now.getTime()))
    .sort((left, right) => left.normalized!.startTime.getTime() - right.normalized!.startTime.getTime())[0];
  if (!next?.normalized) return null;

  const minutesUntil = (next.normalized.startTime.getTime() - now.getTime()) / 60_000;
  const thresholdMinutes = KIOSK_PRE_EVENT_THRESHOLDS_MINUTES.find((threshold) => minutesUntil <= threshold);
  if (!thresholdMinutes) return null;

  const key = `${next.event.id}:${thresholdMinutes}`;
  return firedKeys.has(key) ? null : { event: next.event, thresholdMinutes, key };
}
