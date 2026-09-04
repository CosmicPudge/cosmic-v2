import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildSchoolTimeline, detectSchoolTimelineConflicts, groupSchoolAssignments, hydrateSchoolPlanningAssignments, isAssignmentActiveForPlanning, isAssignmentOverdue, rankSchoolAssignments, schoolAssignmentIdentity } from "./planning.ts";

const date = (value: string) => new Date(value);
const assignment = (overrides: Record<string, unknown> = {}) => ({
  id: "a1", accountId: "account-1", title: "Read chapter", sourceType: "manual" as const,
  completionStatus: "upcoming" as const, planningStatus: "not_started" as const, priority: "normal" as const,
  createdAt: date("2026-08-30T12:00:00Z"), updatedAt: date("2026-08-30T12:00:00Z"), ...overrides,
});

test("assignment identity is stable for provider account records", () => {
  assert.equal(schoolAssignmentIdentity({ id: "ignored", sourceType: "canvas-api", sourceId: "course-1", externalId: "42" }), "canvas-api:course-1:42");
});

test("groups overdue, today, tomorrow, and undated assignments in the requested timezone", () => {
  const now = date("2026-08-30T16:00:00Z");
  const groups = groupSchoolAssignments([
    assignment({ id: "overdue", dueAt: date("2026-08-29T20:00:00Z") }),
    assignment({ id: "today", dueAt: date("2026-08-30T20:00:00Z") }),
    assignment({ id: "tomorrow", dueAt: date("2026-08-31T20:00:00Z") }),
    assignment({ id: "done", completionStatus: "completed", dueAt: date("2026-08-30T20:00:00Z") }),
    assignment({ id: "undated" }),
  ], now, "America/Denver");
  assert.deepEqual(groups.overdue.map((item) => item.id), ["overdue"]);
  assert.deepEqual(groups.today.map((item) => item.id), ["today"]);
  assert.deepEqual(groups.tomorrow.map((item) => item.id), ["tomorrow"]);
  assert.deepEqual(groups.completed.map((item) => item.id), ["done"]);
  assert.deepEqual(groups.undated.map((item) => item.id), ["undated"]);
});

test("ranking is deterministic and explains urgency", () => {
  const recommendations = rankSchoolAssignments([
    assignment({ id: "later", title: "Later", dueAt: date("2026-09-05T18:00:00Z") }),
    assignment({ id: "overdue", title: "Overdue", dueAt: date("2026-08-29T18:00:00Z"), priority: "high" as const, estimatedMinutes: 90 }),
  ], date("2026-08-30T18:00:00Z"));
  assert.equal(recommendations[0]?.assignmentId, "overdue");
  assert.match(recommendations[0]?.reason ?? "", /Overdue/);
});

test("timeline ordering and conflicts have stable IDs", () => {
  const entries = buildSchoolTimeline([
    { id: "b", title: "Second", start: date("2026-08-30T11:00:00Z"), end: date("2026-08-30T12:00:00Z"), kind: "class", sourceType: "school" },
    { id: "a", title: "First", start: date("2026-08-30T10:00:00Z"), end: date("2026-08-30T11:30:00Z"), kind: "deadline", sourceType: "manual" },
  ]);
  assert.deepEqual(entries.map((entry) => entry.id), ["a", "b"]);
  assert.deepEqual(detectSchoolTimelineConflicts(entries), [{ id: "school-conflict:overlap:a:b", firstId: "a", secondId: "b", description: "First overlaps Second." }]);
});

test("hydration rejects malformed records and restores date fields", () => {
  const result = hydrateSchoolPlanningAssignments([JSON.parse(JSON.stringify(assignment({ dueAt: date("2026-09-01T18:00:00Z") }))), { id: "bad" }]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.dueAt?.toISOString(), "2026-09-01T18:00:00.000Z");
});

test("groups invalid due dates as undated instead of formatting them", () => {
  const groups = groupSchoolAssignments([assignment({ id: "invalid", dueAt: new Date("invalid") })], date("2026-08-30T16:00:00Z"), "America/Denver");
  assert.deepEqual(groups.undated.map((item) => item.id), ["invalid"]);
});

test("shared active-work rule excludes provider completion but preserves unknown and late work", () => {
  assert.equal(isAssignmentActiveForPlanning(assignment({ completionStatus: "submitted" })), false);
  assert.equal(isAssignmentActiveForPlanning(assignment({ completionStatus: "graded" })), false);
  assert.equal(isAssignmentActiveForPlanning(assignment({ completionStatus: "completed" })), false);
  assert.equal(isAssignmentActiveForPlanning(assignment({ completionStatus: "overdue" })), true);
  assert.equal(isAssignmentActiveForPlanning(assignment({ completionStatus: "missing" })), true);
  assert.equal(isAssignmentActiveForPlanning(assignment({ completionStatus: "unknown" })), true);
  assert.equal(isAssignmentActiveForPlanning(assignment({ sourceType: "manual", completionStatus: "upcoming", planningStatus: "done" })), false);
});

test("completed past-due assignments are never overdue", () => {
  const now = date("2026-09-10T12:00:00Z");
  const completed = assignment({ id: "completed-past-due", dueAt: date("2026-09-09T12:00:00Z"), completionStatus: "completed" });
  const incomplete = assignment({ id: "incomplete-past-due", dueAt: date("2026-09-09T12:00:00Z"), completionStatus: "unknown" });
  assert.equal(isAssignmentOverdue(completed, now), false);
  assert.equal(isAssignmentOverdue(incomplete, now), true);
  assert.deepEqual(groupSchoolAssignments([completed, incomplete], now).overdue.map((item) => item.id), ["incomplete-past-due"]);
  assert.deepEqual(groupSchoolAssignments([completed, incomplete], now).completed.map((item) => item.id), ["completed-past-due"]);
});
