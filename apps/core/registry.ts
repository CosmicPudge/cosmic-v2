import type { CosmicAppDefinition } from "./types";
import { registerStudioApp } from "./studio";

const registry = new Map<string, CosmicAppDefinition>();

export function defineApp(
  app: CosmicAppDefinition
): CosmicAppDefinition {
  registry.set(app.id, app);
  registerStudioApp(app);
  return app;
}

export function getApp(id: string): CosmicAppDefinition | undefined {
  return registry.get(id);
}

export function getApps(): CosmicAppDefinition[] {
  return Array.from(registry.values());
}

export function getAppByRoute(
  route: string
): CosmicAppDefinition | undefined {
  return Array.from(registry.values()).find(
    (app) => app.route === route
  );
}
