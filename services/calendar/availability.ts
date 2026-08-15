import type {
  CalendarAvailability,
  CalendarEvent,
} from "@/core/contracts";
import type { CalendarDateRange } from "@/engines/calendar";

function overlaps(
  event: CalendarEvent,
  range: CalendarDateRange
): boolean {
  return event.start < range.end && event.end > range.start;
}

export function getCalendarAvailability(
  events: CalendarEvent[],
  range: CalendarDateRange
): CalendarAvailability {
  const overlappingEvents = events.filter((event) =>
    overlaps(event, range)
  );

  const blockingEvents = overlappingEvents.filter(
    (event) => event.priority !== "low"
  );

  const nonBlockingEvents = overlappingEvents.filter(
    (event) => event.priority === "low"
  );

  return {
    available: blockingEvents.length === 0,
    blockingEvents,
    nonBlockingEvents,
  };
}
