export type CosmicApplicationMode = "personal" | "account" | "device";
export type CosmicApplicationScopeKind = "personal" | "account" | "device";

export interface CosmicApplicationScope {
  kind: CosmicApplicationScopeKind;
  id: string;
}

export interface CosmicApplicationContext {
  mode: CosmicApplicationMode;
  scope: CosmicApplicationScope;
  principal: "personal" | "account" | "device";
  commercial: boolean;
}

export const PERSONAL_COSMIC_APPLICATION: CosmicApplicationContext = {
  mode: "personal",
  scope: { kind: "personal", id: "personal" },
  principal: "personal",
  commercial: false,
};
