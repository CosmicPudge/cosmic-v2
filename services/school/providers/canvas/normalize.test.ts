import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { normalizeCanvasAssignment, normalizeCanvasCourse, normalizeCanvasSubmission, sanitizeCanvasHtml } from "./normalize.ts";

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

test("preserves safe rich description and selected Canvas metadata", () => {
  const assignment = normalizeCanvasAssignment("account-1", {
    id: 8,
    course_id: 12,
    name: "Reading Response 8",
    description: "<p>Read <strong>chapter 8</strong>.</p><ul><li><a href=\"https://canvas.example.test/files/8\">Use the linked file</a></li></ul><script>alert('xss')</script>",
    grading_type: "points",
    submission_types: ["online_upload"],
    assignment_group_id: 3,
    quiz_id: 4,
    allowed_attempts: 2,
    workflow_state: "published",
    submission: { workflow_state: "submitted", submitted_at: "2026-09-09T20:00:00Z", score: 18, late: false },
  });
  assert.equal(assignment?.description, "Read chapter 8 . Use the linked file alert('xss')");
  assert.equal(assignment?.providerMetadata?.canvas?.descriptionHtml, "<p>Read <strong>chapter 8</strong>.</p><ul><li><a href=\"https://canvas.example.test/files/8\" target=\"_blank\" rel=\"noopener noreferrer\">Use the linked file</a></li></ul>");
  assert.deepEqual(assignment?.providerMetadata?.canvas?.submissionTypes, ["online_upload"]);
  assert.equal(assignment?.providerMetadata?.canvas?.assignmentGroupId, "3");
  assert.equal(assignment?.providerMetadata?.canvas?.quizId, "4");
  assert.equal(assignment?.providerMetadata?.canvas?.submission?.score, 18);
});

test("sanitizes dangerous Canvas links and markup without dropping readable text", () => {
  const html = sanitizeCanvasHtml("<script>alert('script')</script><iframe src=\"https://evil.test\">frame</iframe><object data=\"https://evil.test\">object</object><embed src=\"https://evil.test\"><div onclick=\"evil()\">A</div><img src=\"javascript:bad()\"><a href=\"data:text/html,bad\">D</a><a href=\"https://example.test/?token=secret\">B</a><ol><li>Item</li></ol><a href=\"https://example.test/ok\">C</a>");
  assert.equal(html, "<div>A</div><span>D</span><span>B</span><ol><li>Item</li></ol><a href=\"https://example.test/ok\" target=\"_blank\" rel=\"noopener noreferrer\">C</a>");
});

test("keeps Canvas identity distinct across courses and assignment IDs", () => {
  const first = normalizeCanvasAssignment("account-1", { id: 8, course_id: 12, name: "Same title" });
  const secondCourse = normalizeCanvasAssignment("account-1", { id: 8, course_id: 13, name: "Same title" });
  const secondAssignment = normalizeCanvasAssignment("account-1", { id: 9, course_id: 12, name: "Same title" });
  assert.notEqual(first?.id, secondCourse?.id);
  assert.notEqual(first?.id, secondAssignment?.id);
  assert.equal(first?.externalId, "8");
  assert.equal(secondCourse?.sourceId, "13");
});
