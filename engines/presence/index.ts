import type { Engine } from "@/core/contracts/Engine";
import type { PresenceSnapshot } from "@/core/contracts";

export class PresenceEngine implements Engine<PresenceSnapshot> {
  async initialize(): Promise<void> {}

  async refresh(): Promise<void> {}

  async getSnapshot(): Promise<PresenceSnapshot> {
    throw new Error("PresenceEngine not implemented.");
  }

  isReady(): boolean {
    return false;
  }

  getLastUpdated(): Date | null {
    return null;
  }
}