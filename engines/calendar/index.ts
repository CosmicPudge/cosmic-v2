import type { Engine } from "@/core/contracts/Engine";
import type {
  CalendarEvent,
  CalendarSnapshot,
} from "@/core/contracts";

export interface CalendarProvider {
  getEvents(): Promise<CalendarEvent[]>;
}

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

    const today = events
  .filter(
    (event) =>
      event.start >= todayStart &&
      event.start < tomorrowStart
  )
  .sort(
    (a, b) =>
      a.start.getTime() -
      b.start.getTime()
  );

const upcoming = events
  .filter(
    (event) =>
      event.start >= tomorrowStart
  )
  .sort(
    (a, b) =>
      a.start.getTime() -
      b.start.getTime()
  );

this.snapshot = {
  today,
  upcoming,
  nextEvent: upcoming[0],
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

    return this.snapshot;
  }

  isReady(): boolean {
    return this.ready;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }
}