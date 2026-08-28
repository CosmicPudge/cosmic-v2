export type CosmicNotificationImportance = "urgent" | "important" | "normal";
export type CosmicNotificationSource = "calendar" | "sports" | "school" | "projects" | "system";

export interface CosmicNotification {
  id: string;
  source: CosmicNotificationSource;
  title: string;
  body?: string;
  timestamp: string;
  read: boolean;
  importance: CosmicNotificationImportance;
  category?: string;
  icon?: string;
  accent?: string;
  href?: string;
  expiresAt?: string;
}

export interface CosmicNotificationSnapshot {
  version: 1;
  notifications: CosmicNotification[];
}
