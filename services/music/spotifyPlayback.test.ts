import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { normalizeSpotifyPlayback } from "./spotifyPlayback.ts";

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

test("unknown Spotify media remains safe and music-compatible in the kiosk", () => {
  const result = normalizeSpotifyPlayback({ ...base, item: { id: "unknown-1", name: "Unknown Item", duration_ms: 90_000 } });
  assert.equal(result.mediaType, "unknown");
  assert.equal(result.playback.track?.mediaType, "unknown");
  assert.equal(result.playback.track?.title, "Unknown Item");
});
