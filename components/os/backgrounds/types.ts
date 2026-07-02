export type BackgroundApp =
  | "dashboard"
  | "weather"
  | "sports"
  | "garage"
  | "calendar"
  | "assistant"
  | "school"
  | "music"
  | "notes"
  | "search"
  | "system"
  | "outlook";

export interface BackgroundEngineProps {
  app: BackgroundApp;
  context?: unknown;
}