import type {
  PresenceSnapshot,
  CosmicMode,
  PresenceState,
} from "@/core/contracts";

import type { Engine } from "@/core/contracts/Engine";

export interface PresenceConfig {
  mode: CosmicMode;
}

export class PresenceEngine
  implements Engine<PresenceSnapshot, PresenceConfig>
{
  private snapshot: PresenceSnapshot | null = null;

  private config: PresenceConfig | null = null;

  private ready = false;

  private lastUpdated: Date | null = null;

  async initialize(config?: PresenceConfig): Promise<void> {
    if (!config) {
      throw new Error("PresenceEngine requires configuration.");
    }

    this.config = config;

    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.config) {
      throw new Error("PresenceEngine has not been initialized.");
    }

    this.snapshot = {
      mode: this.config.mode,

      state: "unknown",

      online: navigator.onLine,

      connectedToCar: false,

      lastUpdated: new Date(),
    };

    this.lastUpdated = new Date();

    this.ready = true;
  }

  async getSnapshot(): Promise<PresenceSnapshot> {
    if (!this.snapshot) {
      throw new Error("Presence snapshot unavailable.");
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