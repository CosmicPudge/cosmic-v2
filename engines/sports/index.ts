import type { SportsSnapshot } from "@/core/contracts";
import type { Engine } from "@/core/contracts/Engine";
import { getSportsSnapshot } from "@/services/sports/snapshot";

export class SportsEngine implements Engine<SportsSnapshot> {
  private snapshot: SportsSnapshot | null = null;
  private lastUpdated: Date | null = null;

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.snapshot = await getSportsSnapshot();
    this.lastUpdated = this.snapshot.lastUpdated;
  }

  async getSnapshot(): Promise<SportsSnapshot> {
    if (!this.snapshot) await this.refresh();
    if (!this.snapshot) throw new Error("Sports snapshot is unavailable.");
    return this.snapshot;
  }

  isReady(): boolean {
    return this.snapshot !== null;
  }

  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }
}
