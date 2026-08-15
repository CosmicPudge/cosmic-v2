import { apps as appMetadata } from "@/config/apps";
import type { WindowId } from "@/stores/windowStore";

export interface CosmicApp {
  id: WindowId;
  name: string;
  icon: string;
  dock: boolean;
  widget: boolean;
}

const windowIds = new Set<string>([
  "clock", "weather", "calendar", "garage", "sports", "school", "notes",
  "projects", "outlook", "assistant", "settings", "music", "files",
  "system",
] satisfies WindowId[]);
const dockIds = new Set<WindowId>(["clock", "weather", "calendar", "sports", "garage", "settings", "system"]);
const widgetIds = new Set<WindowId>(["clock", "weather", "calendar", "garage", "sports", "school", "notes", "projects", "outlook", "assistant", "music", "system"]);

/** Window flags layered onto the canonical app route metadata. */
export const apps: CosmicApp[] = appMetadata
  .filter((app) => windowIds.has(app.id))
  .map((app) => {
    const id = app.id as WindowId;
    return { id, name: app.name, icon: app.icon, dock: dockIds.has(id), widget: widgetIds.has(id) };
  });
