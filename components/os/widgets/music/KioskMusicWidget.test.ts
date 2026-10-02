import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./KioskMusicWidget.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../../../app/globals.css", import.meta.url), "utf8");

test("Music uses real artwork or one clean placeholder", () => {
  assert.match(source, /track\.artworkUrl \? <ArtworkPortrait/);
  assert.match(source, /<div className="kiosk-music-artist-placeholder">♫<\/div>/);
  assert.doesNotMatch(source, /kiosk-music-supporting-artists/);
});

test("Music long titles are bounded and metadata can wrap", () => {
  assert.match(styles, /\.kiosk-music-details h1[\s\S]*-webkit-line-clamp: 3/);
  assert.match(styles, /\.kiosk-music-artists[\s\S]*overflow-wrap: anywhere/);
});
