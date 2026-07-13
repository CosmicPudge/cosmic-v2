import type { Engine } from "@/core/contracts/Engine";
import type { AssistantResponse } from "@/core/contracts";

export class AssistantEngine implements Engine<AssistantResponse> {
  async initialize(): Promise<void> {}

  async refresh(): Promise<void> {}

  async getSnapshot(): Promise<AssistantResponse> {
    throw new Error("AssistantEngine not implemented.");
  }

  isReady(): boolean {
    return false;
  }

  getLastUpdated(): Date | null {
    return null;
  }
}