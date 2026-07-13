export interface AssistantResponse {
  text: string;

  suggestions: string[];

  source:
    | "weather"
    | "calendar"
    | "garage"
    | "sports"
    | "navigation"
    | "system";
}