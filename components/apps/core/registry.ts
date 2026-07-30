import type { CosmicAppDefinition } from "./types";

/**
 * Helper for defining Cosmic applications.
 * This gives us type safety and allows us to
 * extend app definitions in the future.
 */
export function defineApp(
  app: CosmicAppDefinition
): CosmicAppDefinition {
  return app;
}

/**
 * Global application registry.
 *
 * Apps register themselves here.
 */
export const apps: CosmicAppDefinition[] = [];

/**
 * Find an app by its unique id.
 */
export function getApp(id: string) {
  return apps.find((app) => app.id === id);
}

/**
 * Find an app by its route.
 */
export function getAppByRoute(route: string) {
  return apps.find((app) => app.route === route);
}