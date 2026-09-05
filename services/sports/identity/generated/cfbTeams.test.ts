import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CFB_TEAM_IDENTITY } from "./cfbTeams";

test("generated CFB catalog is broad, ID-based, and locally resolves every downloaded logo", () => {
  const entries = Object.values(CFB_TEAM_IDENTITY);
  assert.ok(entries.length > 100);
  assert.equal(new Set(entries.map((entry) => entry.providerTeamId)).size, entries.length);
  for (const entry of entries) {
    assert.equal(entry.active, true);
    if (entry.logoPath) assert.equal(existsSync(join(process.cwd(), "public", entry.logoPath)), true, entry.providerTeamId);
  }
});

test("similar Utah programs retain distinct ESPN provider IDs", () => {
  assert.equal(CFB_TEAM_IDENTITY["254"]?.displayName, "Utah Utes");
  assert.equal(CFB_TEAM_IDENTITY["328"]?.displayName, "Utah State Aggies");
  assert.equal(CFB_TEAM_IDENTITY["3101"]?.displayName, "Utah Tech Trailblazers");
  assert.equal(new Set(["254", "328", "3101"]).size, 3);
});
