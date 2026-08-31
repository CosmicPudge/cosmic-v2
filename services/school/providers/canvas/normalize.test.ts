import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { normalizeCanvasAssignment, normalizeCanvasCourse, normalizeCanvasSubmission } from "./normalize.ts";

test("normalizes an active Canvas course without inventing fields", () => {
  const course = normalizeCanvasCourse({ id: 12, name: "CHEM 1210", course_code: "CHEM 1210", workflow_state: "available" });
  assert.deepEqual(course, { id: "12", name: "CHEM 1210", courseCode: "CHEM 1210", workflowState: "available" });
});

test("normalizes assignment details, strips HTML, and preserves stable identity", () => {
  const assignment = normalizeCanvasAssignment("account-1", { id: 8, course_id: 12, name: "Reading Response 8", description: "<p>Read <strong>chapter 8</strong>.</p><script>bad()</script>", due_at: "2026-09-10T23:59:00Z", unlock_at: "2026-09-01T00:00:00Z", lock_at: null, points_possible: 20, published: true, html_url: "https://canvas.example.test/courses/12/assignments/8", updated_at: "2026-08-30T12:00:00Z", submission: { workflow_state: "submitted", submitted_at: "2026-09-09T20:00:00Z" } });
  assert.equal(assignment?.id, "canvas-api:12:8");
  assert.equal(assignment?.description, "Read chapter 8 . bad()");
  assert.equal(assignment?.completionStatus, "submitted");
  assert.equal(assignment?.pointsPossible, 20);
  assert.equal(assignment?.canvasUrl, "https://canvas.example.test/courses/12/assignments/8");
  assert.equal(assignment?.dueAt?.toISOString(), "2026-09-10T23:59:00.000Z");
});

test("maps Canvas submission states conservatively", () => {
  assert.equal(normalizeCanvasSubmission({ missing: true }), "missing");
  assert.equal(normalizeCanvasSubmission({ workflow_state: "graded" }), "graded");
  assert.equal(normalizeCanvasSubmission({ workflow_state: "unsubmitted" }), "upcoming");
  assert.equal(normalizeCanvasSubmission(null), "unknown");
});
