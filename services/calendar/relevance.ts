import type { CalendarEvent } from "@/core/contracts/Calendar";

export function getRelevantTimedEvent(events: CalendarEvent[], now: Date) {
  const timestamp = now.getTime();
  const relevant = events
    .filter((event) => {
      const start = event.start.getTime();
      const end = event.end.getTime();
      return !event.allDay && !event.completed && Number.isFinite(start) && Number.isFinite(end) && end > timestamp;
    })
    .sort((left, right) => left.start.getTime() - right.start.getTime());

  const current = relevant.find((event) => event.start.getTime() <= timestamp);
  return current ? { event: current, current: true } : { event: relevant[0], current: false };
}
