import { cosmicApi } from "./apiBase";

export type CosmicMusicTrack = {
  title: string;
  artists: string[];
  album: string | null;
};

export type CosmicMusicPlayback = {
  playing: boolean;
  positionMs?: number;
  durationMs?: number | null;
  deviceName?: string | null;
  track: CosmicMusicTrack | null;
};

export type CosmicMusicResponse = {
  connected: boolean;
  playback: CosmicMusicPlayback | null;
};

const MUSIC_API = cosmicApi("music");

export async function getCosmicMusic(): Promise<CosmicMusicResponse> {
  const response = await fetch(MUSIC_API, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Cosmic music API returned ${response.status}`,
    );
  }

  return response.json();
}
