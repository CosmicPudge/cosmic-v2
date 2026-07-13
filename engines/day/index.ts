import type { Engine } from "@/core/contracts/Engine";
import type { DaySnapshot } from "@/core/contracts";

export class DayEngine implements Engine<DaySnapshot> {
  async initialize(): Promise<void> {}

  async refresh(): Promise<void> {}

  async getSnapshot(): Promise<DaySnapshot> {
    throw new Error("DayEngine not implemented.");
  }

  isReady(): boolean {
    return false;
  }

  getLastUpdated(): Date | null {
    return null;
  }
}