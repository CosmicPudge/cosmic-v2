import type { Engine } from "@/core/contracts/Engine";
import type { NavigationSnapshot } from "@/core/contracts";

export class NavigationEngine implements Engine<NavigationSnapshot> {
  async initialize(): Promise<void> {}

  async refresh(): Promise<void> {}

  async getSnapshot(): Promise<NavigationSnapshot> {
    throw new Error("NavigationEngine not implemented.");
  }

  isReady(): boolean {
    return false;
  }

  getLastUpdated(): Date | null {
    return null;
  }
}