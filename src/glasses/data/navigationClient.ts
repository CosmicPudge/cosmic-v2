import { cosmicApi } from "./apiBase";

export type CosmicNavigationManeuver = {
  instruction: string;
  type: string;
  modifier: string | null;
  streetName: string | null;
  distanceMeters: number;
};

export type CosmicNavigationState = {
  destination: string;
  etaMinutes: number;
  distanceMiles: number;
  traffic: "light" | "moderate" | "heavy";
  arrivalTime: string | null;
  nextManeuver: CosmicNavigationManeuver | null;
};

export type CosmicNavigationResponse = {
  navigation: CosmicNavigationState | null;
};

const NAVIGATION_API = cosmicApi("navigation");

export async function getCosmicNavigation(): Promise<CosmicNavigationResponse> {
  const response = await fetch(
    NAVIGATION_API,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Cosmic navigation API returned ${response.status}`,
    );
  }

  return response.json();
}

export async function updateCosmicNavigationLocation(
  lat: number,
  lon: number,
): Promise<CosmicNavigationResponse> {
  const response = await fetch(
    NAVIGATION_API,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        lat,
        lon,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Cosmic navigation update returned ${response.status}`,
    );
  }

  return response.json();
}
