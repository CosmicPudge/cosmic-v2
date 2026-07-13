import type { Engine } from "@/core/contracts/Engine";
import type { VehicleSnapshot } from "@/core/contracts";

export class GarageEngine implements Engine<VehicleSnapshot> {
  async initialize(): Promise<void> {}

  async refresh(): Promise<void> {}

  async getSnapshot(): Promise<VehicleSnapshot> {
    throw new Error("GarageEngine not implemented.");
  }

  isReady(): boolean {
    return false;
  }

  getLastUpdated(): Date | null {
    return null;
  }
}