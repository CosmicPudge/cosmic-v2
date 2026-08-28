import type { MusicSnapshot, PlaybackMediaType } from "@/core/contracts/Music";

export type SpotifyPlaybackItem = {
  id?: string;
  name?: string;
  type?: string;
  duration_ms?: number;
  artists?: { id?: string; name?: string }[];
  images?: { url: string; width?: number; height?: number }[];
  album?: { name?: string; images?: { url: string; width?: number; height?: number }[] };
  show?: { name?: string; images?: { url: string; width?: number; height?: number }[] };
};

export type SpotifyPlaybackResponse = { is_playing?: boolean; progress_ms?: number; currently_playing_type?: string; item?: SpotifyPlaybackItem | null; device?: { name?: string; volume_percent?: number } };

export function spotifyRawPlaybackDiagnostics(data: SpotifyPlaybackResponse) {
  const item = data.item;
  const itemType = item?.type === "track" || item?.type === "episode" ? item.type : "unknown";
  return {
    currentlyPlayingType: data.currently_playing_type === "track" || data.currently_playing_type === "episode" || data.currently_playing_type === "ad" || data.currently_playing_type === "unknown" ? data.currently_playing_type : "unknown",
    hasItem: Boolean(item),
    itemType,
    hasItemId: typeof item?.id === "string" && item.id.length > 0,
    hasItemName: typeof item?.name === "string" && item.name.length > 0,
    hasItemDurationMs: typeof item?.duration_ms === "number",
    hasItemImages: Array.isArray(item?.images) && item.images.length > 0,
    itemImageCount: Array.isArray(item?.images) ? item.images.length : 0,
    hasShow: Boolean(item?.show),
    hasShowName: typeof item?.show?.name === "string" && item.show.name.length > 0,
    hasShowImages: Array.isArray(item?.show?.images) && item.show.images.length > 0,
    showImageCount: Array.isArray(item?.show?.images) ? item.show.images.length : 0,
    hasProgressMs: typeof data.progress_ms === "number",
    playingType: typeof data.is_playing,
  } as const;
}

export function spotifyMediaType(currentlyPlayingType?: string, itemType?: string): PlaybackMediaType {
  const type = currentlyPlayingType ?? itemType;
  if (type === "episode") return "podcast";
  if (type === "track") return "music";
  return "unknown";
}

function artwork(images?: { url: string; width?: number; height?: number }[]) {
  return images?.slice().sort((a, b) => Math.abs((a.width ?? 640) - 640) - Math.abs((b.width ?? 640) - 640))[0]?.url;
}

export function normalizeSpotifyPlayback(data: SpotifyPlaybackResponse): Pick<MusicSnapshot, "playback"> & { mediaType: PlaybackMediaType } {
  const item = data.item;
  const mediaType = spotifyMediaType(data.currently_playing_type, item?.type);
  const artists = item?.artists?.flatMap((artist) => artist.name ? [artist.name] : []) ?? [];
  const isPodcast = mediaType === "podcast";
  const subtitle = isPodcast ? item?.show?.name : artists.join(", ") || undefined;
  const tertiaryText = !isPodcast ? item?.album?.name : undefined;
  const track = item?.id && item.name ? {
    id: item.id,
    title: item.name,
    artists,
    ...(isPodcast ? {} : item.album?.name ? { album: item.album.name } : {}),
    artworkUrl: isPodcast ? artwork(item.images) ?? artwork(item.show?.images) : artwork(item.album?.images),
    ...(item.duration_ms !== undefined ? { durationMs: item.duration_ms } : {}),
    provider: "spotify" as const,
    mediaType,
    ...(subtitle ? { subtitle } : {}),
    ...(tertiaryText ? { tertiaryText } : {}),
  } : undefined;
  return { mediaType, playback: { playing: data.is_playing === true, positionMs: data.progress_ms ?? 0, durationMs: item?.duration_ms, volume: data.device?.volume_percent, deviceName: data.device?.name, updatedAt: new Date().toISOString(), mediaType, track } };
}
