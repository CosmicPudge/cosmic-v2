export type CosmicMode =
  | "desktop"
  | "ambient"
  | "drive"
  | "mobile";

export type PresenceState =
  | "home"
  | "school"
  | "work"
  | "away"
  | "driving"
  | "unknown";

export interface PresenceSnapshot {
  mode: CosmicMode;

  state: PresenceState;

  online: boolean;

  connectedToCar: boolean;

  lastUpdated: Date;
}