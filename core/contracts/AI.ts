export const aiPermissionKeys = ["calendar", "mail", "finance", "garage", "school", "notes", "projects", "music", "context", "publicWeb"] as const;
export type CosmicAIPermissionKey = typeof aiPermissionKeys[number];

export interface CosmicAIPermissions {
  enabled: boolean;
  modules: Record<CosmicAIPermissionKey, boolean>;
}

export const defaultAIPermissions: CosmicAIPermissions = {
  enabled: true,
  modules: { calendar: true, mail: false, finance: false, garage: true, school: true, notes: false, projects: true, music: true, context: true, publicWeb: true },
};

export interface CosmicAIMessage { role: "user" | "assistant"; content: string; }
export interface CosmicAISource { title: string; url?: string; source: "public" | "private"; retrievedAt: string; }
export interface CosmicAIResponse { text: string; sources: CosmicAISource[]; usedModules: string[]; freshness: "current" | "recent" | "cached" | "unknown"; }
