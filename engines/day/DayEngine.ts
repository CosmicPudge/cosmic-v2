import type {
  DaySnapshot,
  DayAction,
} from "@/core/contracts";

import type { Engine } from "@/core/contracts/Engine";

export class DayEngine
  implements Engine<DaySnapshot>
{
  private snapshot: DaySnapshot | null = null;

  private ready = false;

  private lastUpdated: Date | null = null;

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const greeting = this.getGreeting();

    const actions: DayAction[] = [];

    this.snapshot = {
      greeting,

      summary: "Nothing important right now.",

      actions,

      generatedAt: new Date(),
    };

    this.ready = true;

    this.lastUpdated = new Date();
  }

  async getSnapshot(): Promise<DaySnapshot> {
    if (!this.snapshot) {
      throw new Error("Day snapshot unavailable.");
    }

    return this.snapshot;
  }

  isReady(): boolean {
    return this.ready;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }

  private getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";

    if (hour < 18) return "Good Afternoon";

    return "Good Evening";
  }
}