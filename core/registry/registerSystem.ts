import { CosmicSystem } from "../sdk";
import { registry } from "./CosmicRegistry";

export function registerSystem(system: CosmicSystem) {
  registry.register(system);
}
