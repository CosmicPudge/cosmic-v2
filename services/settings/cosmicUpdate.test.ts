import test from "node:test";
import assert from "node:assert/strict";
import { compareCosmicVersions, readCosmicUpdateStatus } from "./cosmicUpdate";

test("Cosmic versions compare numerically", () => {
  assert.equal(compareCosmicVersions("2.4.1", "2.4.0") > 0, true);
  assert.equal(compareCosmicVersions("v2.4.0", "2.4"), 0);
});

test("equal deployment is up to date", () => {
  const previous = process.env.COSMIC_LATEST_VERSION;
  delete process.env.COSMIC_LATEST_VERSION;
  try { assert.equal(readCosmicUpdateStatus().updateAvailable, false); } finally { if (previous === undefined) delete process.env.COSMIC_LATEST_VERSION; else process.env.COSMIC_LATEST_VERSION = previous; }
});

test("newer deployment is available", () => {
  const previous = process.env.COSMIC_LATEST_VERSION;
  process.env.COSMIC_LATEST_VERSION = "99.0.0";
  try { const status = readCosmicUpdateStatus(new Date("2026-10-03T12:00:00Z")); assert.equal(status.updateAvailable, true); assert.equal(status.state, "available"); } finally { if (previous === undefined) delete process.env.COSMIC_LATEST_VERSION; else process.env.COSMIC_LATEST_VERSION = previous; }
});
