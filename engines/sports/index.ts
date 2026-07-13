import type { Engine } from "@/core/contracts/Engine";
import type { SportsSnapshot } from "@/core/contracts";

export class SportsEngine implements Engine<SportsSnapshot> {
  async initialize(): Promise<void> {}

  async refresh(): Promise<void> {}

  async getSnapshot(): Promise<SportsSnapshot> {
    throw new Error("SportsEngine not implemented.");
  }

  isReady(): boolean {
    return false;
  }

  getLastUpdated(): Date | null {
    return null;
  }
}