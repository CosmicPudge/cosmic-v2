import type {
  CosmicAppDefinition,
  AppPresentation,
  WidgetFootprint,
} from "../types";

export interface AppRendererProps {
  app: CosmicAppDefinition;
  presentation: AppPresentation;
  /**
   * The dashboard footprint to preview. Apps that have not migrated yet get
   * the same 2 × 2 default used by the dashboard.
   */
  footprint?: WidgetFootprint;
}
