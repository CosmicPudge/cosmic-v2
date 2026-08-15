import type { Engine } from "@/core/contracts/Engine";
import type {
  CalendarAvailability,
  CalendarEvent,
  CalendarSnapshot,
} from "@/core/contracts";
import { getCalendarAvailability } from "@/services/calendar/availability";

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

export interface CalendarProvider {
  getEvents(
    range?: CalendarDateRange
  ): Promise<CalendarEvent[]>;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export class CalendarEngine
  implements Engine<CalendarSnapshot>
{
  private snapshot: CalendarSnapshot | null = null;

  private lastUpdated: Date | null = null;

  private ready = false;

  private provider: CalendarProvider | null = null;

  setProvider(provider: CalendarProvider): void {
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    if (!this.provider) {
      throw new Error(
        "CalendarEngine requires a CalendarProvider."
      );
    }

    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.provider) {
      throw new Error(
        "CalendarEngine requires a CalendarProvider."
      );
    }

    const events = await this.provider.getEvents();

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(
      tomorrowStart.getDate() + 1
    );

    const sortedEvents = [...events].sort(
      (a, b) =>
        a.start.getTime() -
        b.start.getTime()
    );

    const today = sortedEvents.filter(
      (event) =>
        event.end > todayStart &&
        event.start < tomorrowStart
    );

    const upcoming = sortedEvents.filter(
      (event) =>
        event.start >= tomorrowStart
    );

    const currentEvent = sortedEvents.find(
      (event) =>
        event.start <= now &&
        event.end > now
    );

    const nextEvent = sortedEvents.find(
      (event) => event.start > now
    );

    this.snapshot = {
      today,
      upcoming,
      ...(currentEvent ? { currentEvent } : {}),
      nextEvent,
    };

    this.lastUpdated = new Date();

    this.ready = true;
  }

  async getSnapshot(): Promise<CalendarSnapshot> {
    if (!this.snapshot) {
      throw new Error(
        "Calendar has not been loaded."
      );
    }

    if (
      this.lastUpdated &&
      Date.now() - this.lastUpdated.getTime() >=
        REFRESH_INTERVAL_MS
    ) {
      await this.refresh();
    }

    return this.snapshot;
  }

  async getEvents(
    range?: CalendarDateRange
  ): Promise<CalendarEvent[]> {
    if (!this.provider) {
      throw new Error(
        "CalendarEngine requires a CalendarProvider."
      );
    }

    return this.provider.getEvents(range);
  }

  async getAvailability(
    range: CalendarDateRange
  ): Promise<CalendarAvailability> {
    const events = await this.getEvents(range);

    return getCalendarAvailability(events, range);
  }

  isReady(): boolean {
    return this.ready;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }
}
