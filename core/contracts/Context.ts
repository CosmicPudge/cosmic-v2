export type CosmicContextPriority = "passive" | "glance" | "attention" | "critical";

export type CosmicContextSource =
  | "calendar"
  | "school"
  | "sports"
  | "finance"
  | "garage"
  | "clock"
  | "music"
  | "mail"
  | "weather"
  | "projects";

export interface CosmicContextItem {
  id: string;
  priority: CosmicContextPriority;
  source: CosmicContextSource;
  kind: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  startsAt?: string;
  expiresAt?: string;
  destination?: string;
  action?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface CosmicContextSnapshot {
  items: CosmicContextItem[];
  primary?: CosmicContextItem;
  secondary: CosmicContextItem[];
  passive: CosmicContextItem[];
  generatedAt: string;
}
