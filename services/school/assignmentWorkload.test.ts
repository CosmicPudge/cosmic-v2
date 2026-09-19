import assert from "node:assert/strict";
import test from "node:test";
import type { Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { normalizeLocalSchoolData } from "@/components/school/data/localDataHydration";
import { localAssignmentToPlanning } from "./semesterConsumers";
import { buildSchoolCourseCatalog } from "./courseIdentity";
import { assignmentWorkloadLabel, buildAssignmentWorkload, resolveAssignmentCourse, type AssignmentWorkloadFilters } from "./assignmentWorkload";
import { getSchoolToday } from "./semesterConsumers";
import { isAssignmentOverdue } from "./planning";

const now = new Date("2026-09-18T16:00:00.000Z");
const term: SchoolTerm = { id: "fall", name: "Fall 2026", active: true };
const course: Course = { id: "local-as1010", code: "AS 1010", name: "Heritage and Values", termId: term.id, meetingTimes: [] };
const providerCourse = { id: "818707", name: "Heritage and Values", courseCode: "AS 1010", workflowState: "available" };
const catalog = buildSchoolCourseCatalog([course], [term], [providerCourse]);
const base = (overrides: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment => ({
  id: "a", accountId: "local", title: "Read chapter", sourceType: "manual", completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now, ...overrides,
});
const filters = (overrides: Partial<AssignmentWorkloadFilters> = {}): AssignmentWorkloadFilters => ({ status: "all", source: "all", search: "", ...overrides });
function makeWorkload(assignments: SchoolPlanningAssignment[], selected = filters(), courses = [course], identities = catalog) {
  return buildAssignmentWorkload({ assignments, catalog: identities, courses, filters: selected, now });
}

test("empty and individual manual assignment workloads have honest categories", () => {
  assert.equal(makeWorkload([]).items.length, 0);
  const item = base({ courseId: course.id, courseName: course.name });
  const result = makeWorkload([item]);
  assert.deepEqual(result.groups.undated.map((assignment) => assignment.id), ["a"]);
  assert.deepEqual(makeWorkload([item], filters({ status: "active" })).items.map((assignment) => assignment.id), ["a"]);
});

test("workload summary uses mutually exclusive buckets for one assignment in each state", () => {
  const cases = [
    { label: "Due Soon", item: base({ id: "soon", dueAt: new Date("2026-09-20T23:59:00Z") }), expected: { needsAttention: 0, dueSoon: 1, laterUndated: 0, active: 1 } },
    { label: "Later", item: base({ id: "later", dueAt: new Date("2026-10-20T23:59:00Z") }), expected: { needsAttention: 0, dueSoon: 0, laterUndated: 1, active: 1 } },
    { label: "Undated", item: base({ id: "undated" }), expected: { needsAttention: 0, dueSoon: 0, laterUndated: 1, active: 1 } },
    { label: "Overdue", item: base({ id: "overdue", dueAt: new Date("2026-09-17T23:59:00Z") }), expected: { needsAttention: 1, dueSoon: 0, laterUndated: 0, active: 1 } },
  ];
  for (const item of cases) {
    const result = makeWorkload([item.item], filters({ status: "active" }));
    assert.deepEqual(result.summary, item.expected, item.label);
  }
});

test("all unique active assignments reconcile to exactly one summary bucket", () => {
  const sharedUrl = "https://canvas.example/courses/1/assignments/10";
  const assignments = [
    base({ id: "overdue", dueAt: new Date("2026-09-17T23:59:00Z") }),
    base({ id: "soon", dueAt: new Date("2026-09-20T23:59:00Z") }),
    base({ id: "later", dueAt: new Date("2026-10-20T23:59:00Z") }),
    base({ id: "undated" }),
    base({ id: "complete", completionStatus: "completed", planningStatus: "done" }),
    base({ id: "submitted", sourceType: "canvas-api", completionStatus: "submitted" }),
    base({ id: "graded", sourceType: "canvas-api", completionStatus: "graded" }),
    base({ id: "local-projection", sourceType: "manual", canvasUrl: sharedUrl, dueAt: new Date("2026-09-20T23:59:00Z") }),
    base({ id: "provider-projection", sourceType: "canvas-api", canvasUrl: sharedUrl, dueAt: new Date("2026-09-20T23:59:00Z") }),
  ];
  const result = makeWorkload(assignments, filters({ status: "active" }));
  assert.equal(result.items.length, 5);
  assert.equal(result.summary.active, 5);
  assert.equal(result.summary.needsAttention + result.summary.dueSoon + result.summary.laterUndated, 5);
  assert.equal(result.summary.dueSoon, 2);
});

test("completed, submitted, and graded work is excluded from active summary counts", () => {
  const result = makeWorkload([
    base({ id: "completed", completionStatus: "completed", planningStatus: "done" }),
    base({ id: "submitted", sourceType: "canvas-api", completionStatus: "submitted" }),
    base({ id: "graded", sourceType: "canvas-api", completionStatus: "graded" }),
  ], filters({ status: "all" }));
  assert.deepEqual(result.summary, { needsAttention: 0, dueSoon: 0, laterUndated: 0, active: 0 });
  assert.equal(result.groups.completed.length, 3);
});

test("overdue, due today, upcoming, later, undated sort into deterministic workload groups", () => {
  const assignments = [
    base({ id: "later", title: "Later", dueAt: new Date("2026-10-20T18:00:00Z") }),
    base({ id: "today", title: "Today", dueAt: new Date("2026-09-18T23:59:00Z") }),
    base({ id: "overdue", title: "Overdue", dueAt: new Date("2026-09-17T23:59:00Z") }),
    base({ id: "soon", title: "Soon", dueAt: new Date("2026-09-20T23:59:00Z") }),
    base({ id: "undated", title: "Undated" }),
  ];
  const result = makeWorkload(assignments);
  assert.deepEqual(result.items.map((item) => item.id), ["overdue", "today", "soon", "later", "undated"]);
  assert.deepEqual(result.groups.needsAttention.map((item) => item.id), ["overdue"]);
  assert.deepEqual(result.groups.dueSoon.map((item) => item.id), ["today", "soon"]);
  assert.deepEqual(result.groups.later.map((item) => item.id), ["later"]);
  assert.deepEqual(result.groups.undated.map((item) => item.id), ["undated"]);
  assert.equal(assignmentWorkloadLabel(assignments[2]!, now), "Overdue");
  assert.equal(assignmentWorkloadLabel(assignments[1]!, now), "Due soon");
  assert.equal(assignmentWorkloadLabel(assignments[4]!, now), "No due date");
});

test("completed, submitted, and graded work stays out of active groups and remains filterable", () => {
  const items = [
    base({ id: "completed", completionStatus: "completed", planningStatus: "done", dueAt: new Date("2026-09-17T12:00:00Z") }),
    base({ id: "submitted", sourceType: "canvas-api", completionStatus: "submitted" }),
    base({ id: "graded", sourceType: "canvas-api", completionStatus: "graded" }),
  ];
  assert.deepEqual(makeWorkload(items, filters({ status: "active" })).items, []);
  assert.deepEqual(makeWorkload(items, filters({ status: "completed" })).items.map((item) => item.id), ["completed", "graded", "submitted"]);
  assert.deepEqual(makeWorkload(items, filters({ status: "all" })).groups.needsAttention, []);
});

test("status filters and course plus status filters compose", () => {
  const assignments = [
    base({ id: "overdue", courseId: course.id, dueAt: new Date("2026-09-17T15:00:00Z") }),
    base({ id: "today", courseId: course.id, dueAt: new Date("2026-09-18T22:00:00Z") }),
    base({ id: "other", courseId: "elsewhere", dueAt: new Date("2026-09-17T15:00:00Z") }),
  ];
  assert.deepEqual(makeWorkload(assignments, filters({ status: "overdue" })).items.map((item) => item.id), ["other", "overdue"]);
  assert.deepEqual(makeWorkload(assignments, filters({ courseId: course.id, status: "active" })).items.map((item) => item.id), ["overdue", "today"]);
  assert.deepEqual(makeWorkload(assignments, filters({ courseId: course.id, status: "overdue" })).items.map((item) => item.id), ["overdue"]);
});

test("manual, provider, and text search filters compose without source jargon", () => {
  const assignments = [
    base({ id: "manual", title: "Heritage essay", courseId: course.id, courseName: course.name }),
    base({ id: "provider", title: "Reading", sourceType: "canvas-api", courseId: "818707" }),
  ];
  assert.deepEqual(makeWorkload(assignments, filters({ source: "cosmic", search: "as 1010" })).items.map((item) => item.id), ["manual"]);
  assert.deepEqual(makeWorkload(assignments, filters({ source: "provider", search: "heritage" })).items.map((item) => item.id), ["provider"]);
  assert.deepEqual(makeWorkload(assignments, filters({ search: "does-not-exist" })).items, []);
});

test("provider-only and mixed-course references resolve through canonical course identity", () => {
  const mixed = base({ id: "local", courseId: course.id });
  const provider = base({ id: "canvas", sourceType: "canvas-api", courseId: "818707" });
  const result = makeWorkload([mixed, provider], filters({ courseId: course.id, status: "all" }));
  assert.equal(result.items.length, 2);
  assert.equal(result.resolvedCourseById.get("canvas")?.id, course.id);
  const providerOnlyCatalog = buildSchoolCourseCatalog([], [], [providerCourse]);
  const providerOnly = makeWorkload([base({ courseId: "818707" })], filters({ courseId: "canvas:818707", status: "all" }), [], providerOnlyCatalog);
  assert.equal(providerOnly.items.length, 1);
});

test("unmatched assignments remain visible and ambiguous name matching is not forced", () => {
  const otherCourse: Course = { ...course, id: "local-other", termId: "spring", code: "AS 1010" };
  const ambiguousCatalog = buildSchoolCourseCatalog([course, otherCourse], [term], []);
  const ambiguous = base({ id: "ambiguous", courseName: "AS 1010" });
  const unmatched = base({ id: "unmatched", courseId: "missing", courseName: "Mystery course" });
  assert.equal(resolveAssignmentCourse(ambiguous, ambiguousCatalog, [course, otherCourse]), undefined);
  assert.equal(resolveAssignmentCourse(unmatched, ambiguousCatalog, [course, otherCourse]), undefined);
  assert.deepEqual(makeWorkload([ambiguous, unmatched], filters({ status: "all" }), [course, otherCourse], ambiguousCatalog).items.map((item) => item.id), ["ambiguous", "unmatched"]);
  assert.deepEqual(makeWorkload([ambiguous], filters({ courseId: course.id, status: "all" }), [course, otherCourse], ambiguousCatalog).items, []);
  const providerAmbiguousCatalog = buildSchoolCourseCatalog([course, otherCourse], [term], [providerCourse]);
  const providerByExactId = base({ id: "provider-exact", sourceType: "canvas-api", courseId: "818707" });
  assert.equal(resolveAssignmentCourse(providerByExactId, providerAmbiguousCatalog, [course, otherCourse])?.id, "canvas:818707");
});

test("duplicate provider projections reconcile without duplicate rows", () => {
  const first = base({ id: "calendar-copy", sourceType: "canvas-calendar", title: "Initial title", canvasUrl: "https://canvas.example/courses/1/assignments/2" });
  const canonical = base({ id: "api-copy", sourceType: "canvas-api", title: "Canonical title", completionStatus: "submitted", canvasUrl: first.canvasUrl });
  const result = makeWorkload([first, canonical], filters({ status: "all" }));
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.title, "Canonical title");
  assert.equal(result.items[0]?.completionStatus, "submitted");
});

test("serialized localStorage due dates hydrate into usable manual workload entries", () => {
  const raw = { version: 1, terms: [term], courses: [course], assignments: [{ id: "local-id", courseId: course.id, title: "Persisted", status: "upcoming", priority: "high", source: "manual", dueAt: "2026-09-19T20:00:00.000Z" }], grades: [], goals: [], resources: [] };
  const hydrated = normalizeLocalSchoolData(raw);
  assert.ok(hydrated.assignments[0]?.dueAt instanceof Date);
  const item = localAssignmentToPlanning(hydrated.assignments[0]!, course);
  assert.equal(makeWorkload([item], filters({ courseId: course.id, status: "all" })).items[0]?.dueAt?.toISOString(), "2026-09-19T20:00:00.000Z");
});

test("ISO-persisted local assignment keeps its exclusive bucket after hydration", () => {
  const raw = { version: 1, terms: [term], courses: [course], assignments: [{ id: "real-style", courseId: course.id, title: "Excused Absence or Tardy Memorandum", status: "upcoming", priority: "medium", source: "manual", dueAt: "2026-09-20T23:59:00.000Z" }], grades: [], goals: [], resources: [] };
  const hydrated = normalizeLocalSchoolData(raw);
  const item = localAssignmentToPlanning(hydrated.assignments[0]!, course);
  const result = makeWorkload([item], filters({ status: "active" }));
  assert.deepEqual(result.summary, { needsAttention: 0, dueSoon: 1, laterUndated: 0, active: 1 });
  assert.deepEqual(result.groups.dueSoon.map((assignment) => assignment.title), ["Excused Absence or Tardy Memorandum"]);
});

test("Assignments and Today share overdue, due-today, and completion rules", () => {
  const overdue = base({ id: "overdue", courseId: course.id, dueAt: new Date("2026-09-17T18:00:00Z") });
  const today = base({ id: "today", courseId: course.id, dueAt: new Date("2026-09-18T22:00:00Z") });
  const submitted = base({ id: "submitted", sourceType: "canvas-api", completionStatus: "submitted", dueAt: new Date("2026-09-17T18:00:00Z") });
  const workload = makeWorkload([overdue, today, submitted], filters({ status: "all" }));
  assert.equal(workload.groups.needsAttention[0]?.id, "overdue");
  assert.equal(isAssignmentOverdue(overdue, now), true);
  const schoolToday = getSchoolToday([], term, [overdue, today, submitted], [], now);
  assert.deepEqual(schoolToday.assignments.map((item) => item.id), ["today"]);
  assert.equal(workload.groups.completed.some((item) => item.id === "submitted"), true);
  const earlierToday = base({ id: "earlier-today", dueAt: new Date("2026-09-18T14:00:00Z") });
  assert.equal(makeWorkload([earlierToday], filters({ status: "all" })).groups.needsAttention.length, 0);
  assert.equal(getSchoolToday([], term, [earlierToday], [], now).assignments.length, 1);
});
