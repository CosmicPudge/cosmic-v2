import { cosmicApi } from "./apiBase";

export type CosmicStatus = {
  device: {
    mode: string;
    connected: boolean;
  };

  location: {
    city: string;
    lat: number;
    lon: number;
  };

  weather: {
    temperature: number;
    feelsLike: number;
    condition: string;
    description: string;
    icon: string;
  };

  timestamp: string;
};

const COSMIC_API = cosmicApi("status");

export async function getCosmicStatus(): Promise<CosmicStatus> {
  const response = await fetch(COSMIC_API, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Cosmic API returned ${response.status}`,
    );
  }

  return response.json();
}
