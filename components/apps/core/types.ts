import type { ComponentType, ReactNode } from "react";

/**
 * The amount of information an app should display.
 * This is derived from a widget's footprint.
 */
export type WidgetDisplayMode =
  | "compact"
  | "medium"
  | "expanded"
  | "hero";

/**
 * Where an app is currently being displayed.
 */
export type AppPresentation =
  | "widget"
  | "window"
  | "fullscreen";

/**
 * A dashboard footprint.
 */
export interface WidgetFootprint {
  rows: 1 | 2;
  cols: 1 | 2 | 3 | 4;
}

/**
 * Shared props passed into every app view.
 */
export interface CosmicAppProps {
  presentation: AppPresentation;
  displayMode: WidgetDisplayMode;
}

/**
 * Every Cosmic application must implement this interface.
 */
export interface CosmicAppDefinition {
  /**
   * Unique identifier.
   * Example: weather
   */
  id: string;

  /**
   * Human readable title.
   */
  title: string;

  /**
   * Short description.
   */
  description: string;

  /**
   * Accent color token.
   * Example: "weather"
   */
  accent: string;

  /**
   * Navigation route.
   * Example: /weather
   */
  route: string;

  /**
   * Dock / Dashboard icon.
   */
  icon: ReactNode;

  /**
   * Widget representation.
   */
  widget: ComponentType<CosmicAppProps>;

  /**
   * Floating window representation.
   */
  window: ComponentType<CosmicAppProps>;

  /**
   * Fullscreen application.
   */
  fullscreen: ComponentType<CosmicAppProps>;
}