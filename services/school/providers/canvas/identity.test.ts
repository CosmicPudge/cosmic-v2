import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { canvasAssignmentIdentity, dedupeCanvasAssignmentRows } from "./identity.ts";

test("Canvas import identity ignores mutable title, due date, and description", () => {
  const first = { userId: "user-1", sourceId: "12", externalId: "8", title: "Original", dueAt: "2026-09-10" };
  const changed = { ...first, title: "Renamed", dueAt: "2026-09-11", description: "Updated" };
  assert.equal(canvasAssignmentIdentity(first), canvasAssignmentIdentity(changed));
  assert.deepEqual(dedupeCanvasAssignmentRows([first, changed]), [changed]);
});

test("Canvas import identity separates courses and assignment IDs", () => {
  const base = { userId: "user-1", sourceId: "12", externalId: "8" };
  assert.notEqual(canvasAssignmentIdentity(base), canvasAssignmentIdentity({ ...base, sourceId: "13" }));
  assert.notEqual(canvasAssignmentIdentity(base), canvasAssignmentIdentity({ ...base, externalId: "9" }));
  assert.equal(canvasAssignmentIdentity(base), "user-1:canvas-api:12:8");
  assert.notEqual(canvasAssignmentIdentity(base), canvasAssignmentIdentity({ ...base, sourceType: "canvas-calendar" }));
});
