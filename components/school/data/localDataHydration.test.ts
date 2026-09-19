import test from "node:test";
import assert from "node:assert/strict";
import type { Assignment, Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { hydrateSchoolPlanningAssignments } from "@/services/school/hydration";
import { dedupeSchoolAssignments } from "@/services/school/assignmentIdentity";
import { rankSchoolAssignments } from "@/services/school/planning";
import { localAssignmentToPlanning } from "@/services/school/semesterConsumers";
import { buildTodayAcademicView } from "@/services/school/today";
import { normalizeLocalSchoolData, type LocalSchoolDataShape } from "./localDataHydration";

const now = new Date(2026, 8, 18, 9, 0, 0);
const term: SchoolTerm = { id: "term-1", name: "Fall 2026", active: true };
const course: Course = { id: "course-1", name: "Heritage and Values", code: "AS 1010", termId: term.id, meetingTimes: [] };

function localAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return { id: "local-1", title: "Read chapter", courseId: course.id, dueAt: new Date(2026, 8, 18, 23, 59), status: "upcoming", priority: "medium", source: "manual", ...overrides };
}

function localData(assignments: Assignment[]): LocalSchoolDataShape {
  return { version: 1, terms: [term], courses: [course], assignments, grades: [], goals: [], resources: [] };
}

function today(assignments: Assignment[]) {
  const hydrated = normalizeLocalSchoolData(JSON.parse(JSON.stringify(localData(assignments))) as unknown);
  const planning = hydrated.assignments.map((item) => localAssignmentToPlanning(item, course));
  return buildTodayAcademicView({ courses: hydrated.courses, term: hydrated.terms[0], assignments: planning, events: [], now });
}

test("Date assignment persists as JSON ISO, hydrates to Date, and enters planning safely", () => {
  const source = localData([localAssignment()]);
  const serialized = JSON.stringify(source);
  const persisted = JSON.parse(serialized) as { assignments: Array<{ dueAt: unknown }> };
  assert.equal(persisted.assignments[0].dueAt, source.assignments[0].dueAt?.toISOString());
  const hydrated = normalizeLocalSchoolData(persisted as unknown);
  assert.ok(hydrated.assignments[0].dueAt instanceof Date);
  const planning = localAssignmentToPlanning(hydrated.assignments[0], course);
  assert.doesNotThrow(() => rankSchoolAssignments([planning], now));
});

test("ISO-string assignment date is normalized to the Date domain value", () => {
  const hydrated = normalizeLocalSchoolData({ ...localData([]), assignments: [{ ...localAssignment(), dueAt: "2026-09-18T23:59:00.000Z" }] });
  assert.ok(hydrated.assignments[0].dueAt instanceof Date);
});

test("undated assignments remain present without a due date", () => {
  const hydrated = normalizeLocalSchoolData(JSON.parse(JSON.stringify(localData([localAssignment({ dueAt: undefined })]))));
  assert.equal(hydrated.assignments.length, 1);
  assert.equal(hydrated.assignments[0].dueAt, undefined);
  assert.equal(today([localAssignment({ dueAt: undefined })]).dueTodayAssignments.length, 0);
});

test("invalid serialized assignment dates are dropped without dropping the assignment", () => {
  const hydrated = normalizeLocalSchoolData({ ...localData([]), assignments: [{ ...localAssignment(), dueAt: "not-a-date" }] });
  assert.equal(hydrated.assignments.length, 1);
  assert.equal(hydrated.assignments[0].dueAt, undefined);
  const planning = localAssignmentToPlanning(hydrated.assignments[0], course);
  assert.doesNotThrow(() => rankSchoolAssignments([planning], now));
  assert.equal(buildTodayAcademicView({ courses: hydrated.courses, term, assignments: [planning], events: [], now }).dueTodayAssignments.length, 0);
});

test("hydrated due-today local assignment appears in Due Today", () => {
  const result = today([localAssignment()]);
  assert.deepEqual(result.dueTodayAssignments.map((item) => item.title), ["Read chapter"]);
});

test("hydrated overdue local assignment appears in Needs Attention", () => {
  const result = today([localAssignment({ dueAt: new Date(2026, 8, 17, 23, 59) })]);
  assert.deepEqual(result.overdueAssignments.map((item) => item.title), ["Read chapter"]);
});

test("completed local assignment stays out of urgent buckets after hydration", () => {
  const result = today([localAssignment({ status: "completed", dueAt: new Date(2026, 8, 17, 23, 59) })]);
  assert.equal(result.overdueAssignments.length, 0);
  assert.equal(result.dueTodayAssignments.length, 0);
});

test("provider planning assignments are revived by the existing snapshot hydration path", () => {
  const provider: SchoolPlanningAssignment = { id: "canvas:7", accountId: "account-1", title: "Canvas quiz", courseId: "818707", sourceType: "canvas-api", dueAt: new Date(2026, 8, 18, 16), completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now };
  const hydrated = hydrateSchoolPlanningAssignments(JSON.parse(JSON.stringify([provider])));
  assert.ok(hydrated[0].dueAt instanceof Date);
  assert.doesNotThrow(() => rankSchoolAssignments(hydrated, now));
  assert.equal(buildTodayAcademicView({ courses: [], assignments: hydrated, events: [], now }).dueTodayAssignments[0].title, "Canvas quiz");
});

test("mixed local and provider projections keep the local item and dedupe provider copies", () => {
  const providerBase: SchoolPlanningAssignment = { id: "provider-api", accountId: "account-1", title: "Canvas reading", courseId: "818707", sourceType: "canvas-api", externalId: "42", canvasUrl: "https://canvas.invalid/courses/818707/assignments/42", dueAt: new Date(2026, 8, 20, 12), completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now };
  const calendarCopy: SchoolPlanningAssignment = { ...providerBase, id: "provider-calendar", sourceType: "canvas-calendar" };
  const providerCopies = hydrateSchoolPlanningAssignments(JSON.parse(JSON.stringify([providerBase, calendarCopy])));
  const mixed = dedupeSchoolAssignments([localAssignmentToPlanning(localAssignment(), course), ...providerCopies]);
  assert.equal(mixed.length, 2);
  assert.ok(mixed.some((item) => item.sourceType === "manual"));
  assert.ok(mixed.some((item) => item.sourceType === "canvas-api"));
});

test("local term and goal date fields share the same hydration boundary", () => {
  const raw = { ...localData([]), terms: [{ ...term, startDate: "2026-09-01", endDate: "2026-12-20" }], goals: [{ id: "goal-1", title: "Finish term", completed: false, dueAt: "2026-12-20T12:00:00.000Z" }] };
  const hydrated = normalizeLocalSchoolData(JSON.parse(JSON.stringify(raw)));
  assert.ok(hydrated.terms[0].startDate instanceof Date);
  assert.ok(hydrated.terms[0].endDate instanceof Date);
  assert.ok(hydrated.goals[0].dueAt instanceof Date);
});
