import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { musicPlaybackDiagnostics } from "./musicDiagnostics.ts";

test("diagnostics expose podcast structure without metadata values", () => {
  const snapshot = {
    mediaType: "podcast" as const,
    playing: true,
    positionMs: 42_000,
    durationMs: 3_600_000,
    track: {
      id: "episode-secret-id",
      title: "Private episode title",
      artists: [],
      subtitle: "Private show name",
      artworkUrl: "https://private.example/art.jpg",
      durationMs: 3_600_000,
      provider: "spotify" as const,
      mediaType: "podcast" as const,
    },
    updatedAt: "2026-08-28T00:00:00.000Z",
  };
  const diagnostics = musicPlaybackDiagnostics(snapshot);
  assert.equal(diagnostics.mediaType, "podcast");
  assert.equal(diagnostics.hasPlaybackItem, true);
  assert.equal(diagnostics.hasTitle, true);
  assert.equal(diagnostics.hasSubtitle, true);
  assert.equal(diagnostics.hasArtworkUrl, true);
  assert.equal(diagnostics.hasPositionMs, true);
  assert.equal(diagnostics.hasDurationMs, true);
  assert.equal(diagnostics.playingType, "boolean");
  assert.equal(JSON.stringify(diagnostics).includes("Private episode title"), false);
  assert.equal(JSON.stringify(diagnostics).includes("Private show name"), false);
  assert.equal(JSON.stringify(diagnostics).includes("episode-secret-id"), false);
  assert.equal(JSON.stringify(diagnostics).includes("private.example"), false);
});

test("diagnostics identify missing metadata", () => {
  const diagnostics = musicPlaybackDiagnostics({ mediaType: "podcast", playing: false, positionMs: 0, updatedAt: "" });
  assert.equal(diagnostics.hasPlayback, true);
  assert.equal(diagnostics.hasPlaybackItem, false);
  assert.equal(diagnostics.hasTitle, false);
  assert.equal(diagnostics.hasSubtitle, false);
  assert.equal(diagnostics.hasArtworkUrl, false);
  assert.equal(diagnostics.hasPositionMs, true);
  assert.equal(diagnostics.hasDurationMs, false);
  assert.equal(diagnostics.normalizedItemKind, "podcast");
});

test("music diagnostics retain normal track classification", () => {
  const diagnostics = musicPlaybackDiagnostics({ mediaType: "music", playing: true, positionMs: 1, durationMs: 2, updatedAt: "" });
  assert.equal(diagnostics.mediaType, "music");
  assert.equal(diagnostics.normalizedItemKind, "music");
  assert.equal(diagnostics.playingType, "boolean");
});
