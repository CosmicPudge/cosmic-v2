export interface NavigationSnapshot {
  destination: string;

  etaMinutes: number;

  distanceMiles: number;

  traffic: "light" | "moderate" | "heavy";

  departureTime?: Date;

  routeReady: boolean;
}