export type NavigationTraffic =
  | "light"
  | "moderate"
  | "heavy";

export type NavigationManeuverType =
  | "depart"
  | "continue"
  | "turn"
  | "merge"
  | "fork"
  | "roundabout"
  | "arrive"
  | "unknown";

export interface NavigationCoordinate {
  lat: number;
  lon: number;
}

export interface NavigationManeuver {
  instruction: string;

  type: NavigationManeuverType;

  modifier?: string;

  streetName?: string;

  distanceMeters: number;

  location: NavigationCoordinate;
}

export interface NavigationSnapshot {
  destination: string;

  origin?: NavigationCoordinate;

  destinationLocation?: NavigationCoordinate;

  etaMinutes: number;

  distanceMiles: number;

  traffic: NavigationTraffic;

  departureTime?: Date;

  arrivalTime?: Date;

  routeReady: boolean;

  navigating: boolean;

  nextManeuver?: NavigationManeuver;

  remainingManeuvers?: number;

  lastUpdated?: Date;
}