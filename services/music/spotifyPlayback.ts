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

export type SpotifyFallbackStatus = "success" | "no_item" | "no_content" | "unauthorized" | "rate_limited" | "network_error" | "invalid_response" | "not_attempted";
export type SpotifyFallbackResult = { status: SpotifyFallbackStatus; response?: SpotifyPlaybackResponse };

function usableItem(item: SpotifyPlaybackItem | null | undefined) {
  return Boolean(item?.id && item.name);
}

function activeEpisodeWithoutItem(data: SpotifyPlaybackResponse) {
  return data.currently_playing_type === "episode" && !usableItem(data.item) && (data.is_playing === true || typeof data.progress_ms === "number");
}

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }

export async function resolveSpotifyPlaybackFallback(data: SpotifyPlaybackResponse, requestFallback: () => Promise<{ status: number; json: () => Promise<unknown> }>): Promise<{ data: SpotifyPlaybackResponse; fallback: SpotifyFallbackResult }> {
  if (!activeEpisodeWithoutItem(data)) return { data, fallback: { status: "not_attempted" } };
  let response: { status: number; json: () => Promise<unknown> };
  try { response = await requestFallback(); } catch { return { data, fallback: { status: "network_error" } }; }
  if (response.status === 204) return { data, fallback: { status: "no_content" } };
  if (response.status === 401 || response.status === 403) return { data, fallback: { status: "unauthorized" } };
  if (response.status === 429) return { data, fallback: { status: "rate_limited" } };
  if (!response.status || response.status < 200 || response.status >= 300) return { data, fallback: { status: "invalid_response" } };
  let parsed: unknown;
  try { parsed = await response.json(); } catch { return { data, fallback: { status: "invalid_response" } }; }
  if (!isObject(parsed)) return { data, fallback: { status: "invalid_response" } };
  const fallback = parsed as SpotifyPlaybackResponse;
  if (!fallback.item) return { data, fallback: { status: "no_item", response: fallback } };
  if (fallback.item.type !== "episode" || !usableItem(fallback.item)) return { data, fallback: { status: "invalid_response", response: fallback } };
  return { data: { ...data, ...(typeof fallback.progress_ms === "number" ? { progress_ms: fallback.progress_ms } : {}), ...(typeof fallback.is_playing === "boolean" ? { is_playing: fallback.is_playing } : {}), item: fallback.item }, fallback: { status: "success", response: fallback } };
}

export function spotifyRawPlaybackDiagnostics(data: SpotifyPlaybackResponse, fallback?: SpotifyFallbackResult) {
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
    fallbackAttempted: fallback?.status !== undefined && fallback.status !== "not_attempted",
    fallbackStatus: fallback?.status ?? "not_attempted",
    fallbackHasItem: Boolean(fallback?.response?.item),
    fallbackItemType: fallback?.response?.item?.type === "track" || fallback?.response?.item?.type === "episode" ? fallback.response.item.type : "unknown",
    fallbackHasItemId: typeof fallback?.response?.item?.id === "string" && fallback.response.item.id.length > 0,
    fallbackHasItemName: typeof fallback?.response?.item?.name === "string" && fallback.response.item.name.length > 0,
    fallbackHasDurationMs: typeof fallback?.response?.item?.duration_ms === "number",
    fallbackHasShow: Boolean(fallback?.response?.item?.show),
    fallbackHasShowName: typeof fallback?.response?.item?.show?.name === "string" && fallback.response.item.show.name.length > 0,
    fallbackHasArtwork: (Array.isArray(fallback?.response?.item?.images) && fallback.response.item.images.length > 0) || (Array.isArray(fallback?.response?.item?.show?.images) && fallback.response.item.show.images.length > 0),
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
