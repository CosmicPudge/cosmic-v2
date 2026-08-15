import type { CalendarEvent } from "@/core/contracts";
import { getCalendarAvailability } from "./availability";

export interface AlternateTimeOptions {
  daysToSearch?: number;
}

export interface AlternateTimeSuggestion {
  start: Date;
  end: Date;
}

export function findAlternateTime(
  events: CalendarEvent[],
  requested: AlternateTimeSuggestion,
  options: AlternateTimeOptions = {}
): AlternateTimeSuggestion | null {
  const daysToSearch = options.daysToSearch ?? 7;
  const duration =
    requested.end.getTime() - requested.start.getTime();

  if (duration <= 0) {
    return null;
  }

  for (let offset = 1; offset <= daysToSearch; offset += 1) {
    const start = new Date(requested.start);
    start.setDate(start.getDate() + offset);

    const end = new Date(start.getTime() + duration);
    const availability = getCalendarAvailability(events, {
      start,
      end,
    });

    if (availability.available) {
      return { start, end };
    }
  }

  return null;
}
