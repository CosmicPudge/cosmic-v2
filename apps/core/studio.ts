import type { ReactNode } from "react";

import type { AppPresentation, CosmicAppDefinition } from "./types";

export interface ComingSoonAppDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  icon?: ReactNode;
  plannedFeatures?: readonly string[];
  status: "coming-soon";
  supportedPresentations: AppPresentation[];
}

export type StudioAppDefinition =
  | (CosmicAppDefinition & { status: "implemented" })
  | ComingSoonAppDefinition;

const studioRegistry = new Map<string, StudioAppDefinition>();

export function registerStudioApp(app: CosmicAppDefinition): CosmicAppDefinition {
  studioRegistry.set(app.id, { ...app, status: "implemented" });
  return app;
}

export function registerComingSoonApp(
  app: Omit<ComingSoonAppDefinition, "status" | "supportedPresentations">
    & Partial<Pick<ComingSoonAppDefinition, "supportedPresentations">>
): ComingSoonAppDefinition {
  const entry: ComingSoonAppDefinition = {
    ...app,
    status: "coming-soon",
    supportedPresentations: app.supportedPresentations ?? ["widget", "window", "fullscreen"],
  };

  if (!studioRegistry.has(entry.id)) {
    studioRegistry.set(entry.id, entry);
  }

  return entry;
}

export function getStudioApps(): StudioAppDefinition[] {
  return Array.from(studioRegistry.values());
}

export function isImplementedStudioApp(
  app: StudioAppDefinition
): app is CosmicAppDefinition & { status: "implemented" } {
  return app.status === "implemented";
}
