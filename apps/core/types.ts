import type { ComponentType, ReactNode } from "react";

export type WidgetSize =
  | "1x1"
  | "2x1"
  | "3x1"
  | "4x1"
  | "1x2"
  | "2x2"
  | "3x2"
  | "4x2";

export type AppPresentation =
  | "widget"
  | "window"
  | "fullscreen";

/**
 * A transitional semantic layout label derived from a widget footprint.
 */
export type WidgetDisplayMode =
  | "compact"
  | "medium"
  | "expanded"
  | "hero";

export interface WidgetFootprint {
  cols: 1 | 2 | 3 | 4;
  rows: 1 | 2;
}

export interface CosmicAppProps {
  presentation: AppPresentation;

  /**
   * Canonical dashboard footprint.
   * This will become the primary sizing model throughout Cosmic.
   */
  footprint?: WidgetFootprint;

  /**
   * Convenience lookup key.
   * This is derived from the footprint and will remain
   * available while apps migrate.
   */
  widgetSize: WidgetSize;
}

export interface CosmicAppDefinition {
  id: string;
  title: string;
  description: string;

  accent: string;
  route: string;

  icon: ReactNode;

  widget: ComponentType<CosmicAppProps>;
  window: ComponentType<CosmicAppProps>;
  fullscreen: ComponentType<CosmicAppProps>;
}
