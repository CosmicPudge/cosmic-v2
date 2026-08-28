import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { normalizeSpotifyPlayback, spotifyRawPlaybackDiagnostics } from "./spotifyPlayback.ts";

test("raw diagnostics distinguish a null Spotify item", () => {
  const diagnostics = spotifyRawPlaybackDiagnostics({ currently_playing_type: "episode", is_playing: true, progress_ms: 42_000, item: null });
  assert.equal(diagnostics.hasItem, false);
  assert.equal(diagnostics.currentlyPlayingType, "episode");
  assert.equal(diagnostics.hasProgressMs, true);
});

test("raw diagnostics identify a complete Spotify episode structurally", () => {
  const diagnostics = spotifyRawPlaybackDiagnostics({ currently_playing_type: "episode", is_playing: true, progress_ms: 42_000, item: { type: "episode", id: "private-id", name: "Private episode", duration_ms: 1000, images: [{ url: "https://private.example/episode.jpg" }], show: { name: "Private show", images: [{ url: "https://private.example/show.jpg" }, { url: "https://private.example/show-2.jpg" }] } } });
  assert.deepEqual({ hasItem: diagnostics.hasItem, itemType: diagnostics.itemType, hasItemId: diagnostics.hasItemId, hasItemName: diagnostics.hasItemName, hasItemDurationMs: diagnostics.hasItemDurationMs, hasItemImages: diagnostics.hasItemImages, itemImageCount: diagnostics.itemImageCount, hasShow: diagnostics.hasShow, hasShowName: diagnostics.hasShowName, hasShowImages: diagnostics.hasShowImages, showImageCount: diagnostics.showImageCount, hasProgressMs: diagnostics.hasProgressMs }, { hasItem: true, itemType: "episode", hasItemId: true, hasItemName: true, hasItemDurationMs: true, hasItemImages: true, itemImageCount: 1, hasShow: true, hasShowName: true, hasShowImages: true, showImageCount: 2, hasProgressMs: true });
  const serialized = JSON.stringify(diagnostics);
  assert.equal(serialized.includes("private-id"), false);
  assert.equal(serialized.includes("Private episode"), false);
  assert.equal(serialized.includes("Private show"), false);
  assert.equal(serialized.includes("private.example"), false);
});

test("raw diagnostics identify incomplete episode fields", () => {
  const missingId = spotifyRawPlaybackDiagnostics({ currently_playing_type: "episode", item: { type: "episode", name: "Episode" } });
  const missingName = spotifyRawPlaybackDiagnostics({ currently_playing_type: "episode", item: { type: "episode", id: "episode-id" } });
  assert.equal(missingId.hasItem, true);
  assert.equal(missingId.hasItemId, false);
  assert.equal(missingId.hasItemName, true);
  assert.equal(missingName.hasItem, true);
  assert.equal(missingName.hasItemId, true);
  assert.equal(missingName.hasItemName, false);
});

test("raw diagnostics identify normal track structure", () => {
  const diagnostics = spotifyRawPlaybackDiagnostics({ currently_playing_type: "track", item: { type: "track", id: "track-id", name: "Track", duration_ms: 1000, images: [{ url: "https://private.example/album.jpg" }] } });
  assert.equal(diagnostics.currentlyPlayingType, "track");
  assert.equal(diagnostics.itemType, "track");
  assert.equal(diagnostics.hasItem, true);
  assert.equal(diagnostics.hasItemId, true);
  assert.equal(diagnostics.hasItemName, true);
  assert.equal(diagnostics.hasItemDurationMs, true);
});

const base = { is_playing: true, progress_ms: 42_000, device: { name: "Cosmic Display" } };

test("normalizes a structured Spotify track as music", () => {
  const result = normalizeSpotifyPlayback({ ...base, currently_playing_type: "track", item: { id: "track-1", type: "track", name: "Starlight", duration_ms: 180_000, artists: [{ name: "Cosmic Band" }], album: { name: "Night Drive", images: [{ url: "https://example.test/album.jpg", width: 640 }] } } });
  assert.equal(result.mediaType, "music");
  assert.equal(result.playback.mediaType, "music");
  assert.equal(result.playback.track?.title, "Starlight");
  assert.equal(result.playback.track?.subtitle, "Cosmic Band");
});

test("normalizes a Spotify episode as a podcast", () => {
  const result = normalizeSpotifyPlayback({ ...base, currently_playing_type: "episode", item: { id: "episode-1", type: "episode", name: "The Long Night", duration_ms: 3_600_000, show: { name: "Cosmic Stories", images: [{ url: "https://example.test/show.jpg", width: 640 }] } } });
  assert.equal(result.mediaType, "podcast");
  assert.equal(result.playback.mediaType, "podcast");
  assert.equal(result.playback.track?.mediaType, "podcast");
  assert.equal(result.playback.track?.title, "The Long Night");
  assert.equal(result.playback.track?.subtitle, "Cosmic Stories");
  assert.equal(result.playback.track?.artworkUrl, "https://example.test/show.jpg");
  assert.equal(result.playback.positionMs, 42_000);
  assert.equal(result.playback.durationMs, 3_600_000);
});

test("prefers episode artwork and does not require music fields", () => {
  const result = normalizeSpotifyPlayback({ ...base, currently_playing_type: "episode", item: { id: "episode-2", name: "A Chapter", duration_ms: 120_000, images: [{ url: "https://example.test/episode.jpg", width: 640 }], show: { name: "Cosmic Stories", images: [{ url: "https://example.test/show.jpg", width: 640 }] } } });
  assert.equal(result.playback.track?.mediaType, "podcast");
  assert.equal(result.playback.track?.title, "A Chapter");
  assert.equal(result.playback.track?.subtitle, "Cosmic Stories");
  assert.equal(result.playback.track?.artworkUrl, "https://example.test/episode.jpg");
  assert.deepEqual(result.playback.track?.artists, []);
});

test("falls back to show artwork when an episode has no artwork", () => {
  const result = normalizeSpotifyPlayback({ ...base, currently_playing_type: "episode", item: { id: "episode-3", name: "Another Chapter", duration_ms: 120_000, show: { name: "Cosmic Stories", images: [{ url: "https://example.test/show.jpg", width: 640 }] } } });
  assert.equal(result.playback.track?.artworkUrl, "https://example.test/show.jpg");
});

test("preserves the real metadata-less Spotify episode shape without fabricating an item", () => {
  const result = normalizeSpotifyPlayback({ is_playing: true, progress_ms: 42_000, currently_playing_type: "episode", item: null });
  assert.equal(result.mediaType, "podcast");
  assert.equal(result.playback.mediaType, "podcast");
  assert.equal(result.playback.positionMs, 42_000);
  assert.equal(result.playback.track, undefined);
  assert.equal(result.playback.durationMs, undefined);
});

test("unknown Spotify media remains safe and music-compatible in the kiosk", () => {
  const result = normalizeSpotifyPlayback({ ...base, item: { id: "unknown-1", name: "Unknown Item", duration_ms: 90_000 } });
  assert.equal(result.mediaType, "unknown");
  assert.equal(result.playback.track?.mediaType, "unknown");
  assert.equal(result.playback.track?.title, "Unknown Item");
});
