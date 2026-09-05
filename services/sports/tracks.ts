import type { SportsEvent } from "@/core/contracts/Sports";

export interface MotorsportTrackIdentity {
  sport: "f1" | "nascar";
  providerTrackId?: string;
  providerCircuitId?: string;
  canonicalId: string;
  name: string;
  location?: string;
  country?: string;
  configuration?: string;
  outlineAsset?: string;
}

const f1Tracks: MotorsportTrackIdentity[] = [
  { sport: "f1", providerCircuitId: "monza", canonicalId: "monza", name: "Autodromo Nazionale Monza", location: "Monza, Italy", country: "Italy", outlineAsset: "/sports/tracks/f1/monza.svg" },
  { sport: "f1", providerCircuitId: "marina_bay", canonicalId: "marina-bay", name: "Marina Bay Street Circuit", location: "Singapore", country: "Singapore", outlineAsset: "/sports/tracks/f1/marina-bay.svg" },
  { sport: "f1", providerCircuitId: "americas", canonicalId: "austin", name: "Circuit of the Americas", location: "Austin, United States", country: "United States", outlineAsset: "/sports/tracks/f1/austin.svg" },
];

const nascarTracks: MotorsportTrackIdentity[] = [
  { sport: "nascar", providerTrackId: "27", canonicalId: "daytona-tri-oval", name: "Daytona International Speedway", location: "Daytona Beach, Florida", country: "United States", configuration: "Tri-Oval Circuit", outlineAsset: "/sports/tracks/nascar/daytona-tri-oval.svg" },
  { sport: "nascar", providerTrackId: "27.2", canonicalId: "daytona-road", name: "Daytona International Speedway", location: "Daytona Beach, Florida", country: "United States", configuration: "Road Circuit", outlineAsset: "/sports/tracks/nascar/daytona-road.svg" },
  { sport: "nascar", providerTrackId: "20.3", canonicalId: "cota-nascar", name: "Circuit of the Americas", location: "Austin, Texas", country: "United States", configuration: "NASCAR Circuit", outlineAsset: "/sports/tracks/nascar/cota-nascar.svg" },
];

export const motorsportTrackRegistry = [...f1Tracks, ...nascarTracks];

function normalized(value: string | undefined) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

export function resolveMotorsportTrack(event: SportsEvent): MotorsportTrackIdentity | undefined {
  if (event.sport !== "f1" && event.sport !== "nascar") return undefined;
  const metadata = event.metadata;
  const providerId = event.sport === "f1" ? metadata?.circuitId : metadata?.trackId;
  const track = normalized(metadata?.track ?? metadata?.circuit ?? event.venue);
  const byId = motorsportTrackRegistry.find((item) => item.sport === event.sport && ((event.sport === "f1" && item.providerCircuitId === providerId) || (event.sport === "nascar" && (item.providerTrackId === providerId || item.providerTrackId === metadata?.trackId))));
  if (byId) return { ...byId, ...(metadata?.trackConfiguration ? { configuration: metadata.trackConfiguration } : {}) };
  const byName = motorsportTrackRegistry.find((item) => item.sport === event.sport && (normalized(item.name) === track || normalized(item.canonicalId) === track || track.includes(normalized(item.canonicalId))));
  return byName ? { ...byName, ...(metadata?.trackConfiguration ? { configuration: metadata.trackConfiguration } : {}) } : undefined;
}
