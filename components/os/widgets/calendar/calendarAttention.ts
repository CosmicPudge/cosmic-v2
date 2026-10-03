import type { CalendarEvent } from "@/core/contracts";

export const CALENDAR_ALERT_THRESHOLDS_MINUTES = [15, 10, 5, 0] as const;
export type CalendarAlertThreshold = (typeof CALENDAR_ALERT_THRESHOLDS_MINUTES)[number];

export interface CalendarPreEventAlert {
  event: CalendarEvent;
  threshold: CalendarAlertThreshold;
  key: string;
  timingLabel: string;
}

export function selectCalendarPreEventAlert(events: CalendarEvent[], now = new Date(), firedKeys = new Set<string>()): CalendarPreEventAlert | null {
  const candidates = events
    .filter((event) => event.end.getTime() > now.getTime())
    .sort((left, right) => left.start.getTime() - right.start.getTime());
  for (const event of candidates) {
    const minutesUntil = (event.start.getTime() - now.getTime()) / 60_000;
    const threshold = CALENDAR_ALERT_THRESHOLDS_MINUTES.find((candidate) => candidate === 0 ? minutesUntil <= 0 && minutesUntil >= -1 : minutesUntil <= candidate && minutesUntil > candidate - 1);
    if (threshold === undefined) continue;
    const key = `${event.id}:${threshold === 0 ? "now" : threshold}`;
    if (firedKeys.has(key)) continue;
    return { event, threshold, key, timingLabel: threshold === 0 ? "EVENT STARTING NOW" : `EVENT IN ${threshold} MIN` };
  }
  return null;
}
