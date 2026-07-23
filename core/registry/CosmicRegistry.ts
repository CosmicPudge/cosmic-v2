import { CosmicSystem } from "../sdk";

class CosmicRegistry {

  private systems = new Map<string, CosmicSystem>();

  register(system: CosmicSystem) {

    if (this.systems.has(system.id)) {
      throw new Error(`System "${system.id}" already registered.`);
    }

    this.systems.set(system.id, system);
  }

  getSystems(): CosmicSystem[] {
    return [...this.systems.values()];
  }

  getSystem(id: string) {
    return this.systems.get(id);
  }

  clear() {
    this.systems.clear();
  }

}

export const registry = new CosmicRegistry();
