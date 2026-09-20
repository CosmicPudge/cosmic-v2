import assert from "node:assert/strict";
import test from "node:test";
import { canUseAccountCanvasControls, currentSchoolTermLabel, schoolSyncPresentation } from "./trustPresentation";

test("personal and local scopes never claim a cloud sync even with stale synced metadata", () => {
  for (const scope of ["personal", "local"] as const) {
    const status = schoolSyncPresentation(scope, "synced", "2026-09-19T12:00:00.000Z");
    assert.equal(status.label, "Saved locally");
    assert.equal(status.detail, "School data is stored in this browser.");
    assert.doesNotMatch(status.label, /synced|cloud|backed up/i);
  }
});

test("account sync status reflects actual state and does not invent recency", () => {
  assert.equal(schoolSyncPresentation("account", "synced").label, "Synced");
  assert.match(schoolSyncPresentation("account", "synced", "not-a-date").label, /^Synced$/);
  assert.match(schoolSyncPresentation("account", "synced", "2026-09-19T12:00:00.000Z").label, /^Synced /);
  assert.equal(schoolSyncPresentation("account", "syncing").label, "Syncing…");
  assert.equal(schoolSyncPresentation("account", "offline").label, "Offline");
  assert.equal(schoolSyncPresentation("account", "error").label, "Sync unavailable");
  assert.equal(schoolSyncPresentation("account", "conflict").label, "Sync conflict");
});

test("term label comes from active canonical state, then a safe first-term fallback", () => {
  assert.equal(currentSchoolTermLabel([]), "No term selected");
  assert.equal(currentSchoolTermLabel([{ id: "fall", name: "Fall 2026" }]), "Fall 2026");
  assert.equal(currentSchoolTermLabel([{ id: "fall", name: "Fall 2026" }, { id: "spring", name: "Spring 2027", active: true }]), "Spring 2027");
});

test("Canvas connection controls are available only in account scope", () => {
  assert.equal(canUseAccountCanvasControls("personal"), false);
  assert.equal(canUseAccountCanvasControls("local"), false);
  assert.equal(canUseAccountCanvasControls("account"), true);
});
