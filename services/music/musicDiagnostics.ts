import type { PlaybackState } from "@/core/contracts/Music";

export function musicPlaybackDiagnostics(playback: PlaybackState) {
  const item = playback.track;
  return {
    mediaType: playback.mediaType ?? item?.mediaType ?? "unknown",
    hasPlayback: true,
    hasPlaybackItem: Boolean(item),
    hasTrackObject: Boolean(item),
    hasTitle: typeof item?.title === "string" && item.title.trim().length > 0,
    hasSubtitle: typeof item?.subtitle === "string" && item.subtitle.trim().length > 0,
    hasArtworkUrl: typeof item?.artworkUrl === "string" && item.artworkUrl.length > 0,
    hasPositionMs: typeof playback.positionMs === "number",
    hasDurationMs: typeof playback.durationMs === "number" || typeof item?.durationMs === "number",
    playingType: typeof playback.playing,
    normalizedItemKind: item?.mediaType ?? playback.mediaType ?? "unknown",
  } as const;
}
