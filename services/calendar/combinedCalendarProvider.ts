import type { CalendarEvent } from "@/core/contracts";
import type {
  CalendarDateRange,
  CalendarProvider,
} from "@/engines/calendar";

export class CombinedCalendarProvider
  implements CalendarProvider
{
  private readonly providers: CalendarProvider[];

  constructor(
    providers: CalendarProvider[]
  ) {
    this.providers = providers;
  }

  async getEvents(
    range?: CalendarDateRange
  ): Promise<CalendarEvent[]> {
    const results =
      await Promise.allSettled(
        this.providers.map((provider) =>
          provider.getEvents(range)
        )
      );

    const events = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;
      // Log only a sanitized failure category; never expose provider URLs or credentials.
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason ?? "");
      const category = /401|403|unauthori[sz]ed|authentication|credential/i.test(message)
        ? "authentication-error"
        : /timeout|timed out|abort/i.test(message)
          ? "timeout"
          : "provider-error";
      console.error(`[calendar-provider] provider=${index + 1} status=failed category=${category}`);
      return [];
    });

    const filtered =
      range
        ? events.filter(
            (event) =>
              event.start < range.end &&
              event.end > range.start
          )
        : events;

    const uniqueEvents = new Map<string, CalendarEvent>();

    for (const event of filtered) {
      const key = getEventIdentity(event);

      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      }
    }

    return [...uniqueEvents.values()].sort(
      (a, b) =>
        a.start.getTime() -
        b.start.getTime()
    );
  }
}

function getEventIdentity(event: CalendarEvent): string {
  if (event.uid || event.calendarId) {
    return [
      event.source ?? "unknown",
      event.calendarId ?? event.calendarName ?? "unknown",
      event.uid ?? event.id,
      event.recurrenceId ?? "",
    ].join(":");
  }

  if (event.id) {
    return [event.source ?? "unknown", event.id].join(":");
  }

  return [
    event.source ?? "unknown",
    event.calendarName ?? "unknown",
    event.title,
    event.start.toISOString(),
    event.end.toISOString(),
  ].join(":");
}
