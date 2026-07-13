import type { Engine } from "@/core/contracts/Engine";
import type { CalendarSnapshot } from "@/core/contracts";

export class CalendarEngine implements Engine<CalendarSnapshot> {
  async initialize(): Promise<void> {}

  async refresh(): Promise<void> {}

  async getSnapshot(): Promise<CalendarSnapshot> {
    throw new Error("CalendarEngine not implemented.");
  }

  isReady(): boolean {
    return false;
  }

  getLastUpdated(): Date | null {
    return null;
  }
}