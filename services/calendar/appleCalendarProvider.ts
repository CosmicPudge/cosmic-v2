import type { CalendarEvent } from "@/core/contracts";
import type {
  CalendarDateRange,
  CalendarProvider,
} from "@/engines/calendar";

import {
  discoverCalDav,
  discoverCalendars,
  fetchCalendarEvents,
  getCalDavCalendarId,
} from "./caldav";

import type { CalDavConfig } from "./caldav";

import {
  normalizeCalDavCalendarData,
} from "./icalNormalizer";
import { registerWritableEventTarget } from "./writableEventRegistry";

export interface AppleCalendarConfig {
  username: string;
  password: string;
  serverUrl?: string;
}

const CACHE_DURATION_MS = 5 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 30;

interface AppleCalendarCache {
  start: number;
  end: number;
  events: CalendarEvent[];
  expiresAt: number;
}

export class AppleCalendarProvider
  implements CalendarProvider
{
  private readonly config: CalDavConfig;

  private cache: AppleCalendarCache | null = null;

  private pending = new Map<
    string,
    Promise<CalendarEvent[]>
  >();

  constructor(config?: AppleCalendarConfig) {
    const username =
      config?.username ??
      process.env.APPLE_CALENDAR_USERNAME;

    const password =
      config?.password ??
      process.env.APPLE_CALENDAR_PASSWORD;

    if (!username || !password) {
      throw new Error(
        "Apple Calendar credentials are not configured."
      );
    }

    this.config = {
      username,
      password,
      serverUrl:
        config?.serverUrl ??
        process.env.APPLE_CALENDAR_SERVER ??
        "https://caldav.icloud.com",
    };
  }

  async getEvents(
    range?: CalendarDateRange
  ): Promise<CalendarEvent[]> {
    const now = new Date();

    const start =
      range?.start ??
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const end =
      range?.end ??
      new Date(
        start.getTime() +
          DEFAULT_WINDOW_DAYS *
            24 *
            60 *
            60 *
            1000
      );

    const startTime = start.getTime();
    const endTime = end.getTime();

    if (
      this.cache &&
      this.cache.start <= startTime &&
      this.cache.end >= endTime &&
      Date.now() < this.cache.expiresAt
    ) {
      return filterEventsToRange(
        this.cache.events,
        start,
        end
      );
    }

    const requestKey =
      `${start.toISOString()}:${end.toISOString()}`;

    const pending =
      this.pending.get(requestKey);

    if (pending) {
      return pending;
    }

    const request =
      this.fetchEvents(start, end).finally(() => {
        this.pending.delete(requestKey);
      });

    this.pending.set(
      requestKey,
      request
    );

    return request;
  }

  private async fetchEvents(
    start: Date,
    end: Date
  ): Promise<CalendarEvent[]> {
    const discovery =
      await discoverCalDav(this.config);

    const calendars =
      await discoverCalendars(
        this.config,
        discovery.calendarHomeUrl
      );

    const eventCalendars =
      calendars.filter((calendar) =>
        calendar.supportedComponents.includes(
          "VEVENT"
        )
      );

    const events =
      await Promise.all(
        eventCalendars.map(
          async (calendar) => {
            const rawResponse =
              await fetchCalendarEvents(
                this.config,
                calendar,
                start,
                end
              );

            const calendarId = getCalDavCalendarId(calendar);
            const writable =
              calendar.displayName ===
              process.env.COSMIC_DEFAULT_CALENDAR_NAME?.trim();

            return normalizeCalDavCalendarData(
              rawResponse,
              {
                calendarName:
                  calendar.displayName,
                calendarId,
                writable,
                getWriteId: (resourceHref, etag, event) =>
                  registerWritableEventTarget({
                    calendarId,
                    resourceUrl: new URL(resourceHref, calendar.url).toString(),
                    etag,
                    ...(event.uid ? { uid: event.uid } : {}),
                    isRecurring: event.isRecurring ?? false,
                    allDay: event.allDay ?? false,
                  }),
              },
              {
                start,
                end,
              }
            );
          }
        )
      );

    const normalized =
      events
        .flat()
        .map((event) => ({
          ...event,
          source: "apple" as const,
          category: "personal" as const,
          priority: "normal" as const,
        }))
        .sort(
          (a, b) =>
            a.start.getTime() -
            b.start.getTime()
        );

    this.cache = {
      start: start.getTime(),
      end: end.getTime(),
      events: normalized,
      expiresAt:
        Date.now() +
        CACHE_DURATION_MS,
    };

    return normalized;
  }

  invalidateCache(): void {
    this.cache = null;
  }
}

function filterEventsToRange(
  events: CalendarEvent[],
  start: Date,
  end: Date
): CalendarEvent[] {
  return events.filter(
    (event) =>
      event.start < end &&
      event.end > start
  );
}
