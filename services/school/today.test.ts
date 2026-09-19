import test from "node:test";
import assert from "node:assert/strict";
import type { Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { SchoolEvent } from "@/components/school/data/types";
import { buildSchoolCourseCatalog } from "./courseIdentity";
import { buildTodayAcademicView, resolveTodayAssignmentCourseId, resolveTodayEventCourseId } from "./today";

const now = new Date(2026, 8, 18, 9, 0, 0); // Friday, fixed local test time
const term = { id: "term-1", name: "Fall 2026", active: true };
const course: Course = { id: "local-course-1", code: "AS 1010", name: "Heritage and Values", termId: term.id, meetingTimes: [{ weekday: 5, startTime: "10:00", endTime: "10:50" }] };
const providerCourse = { id: "818707", name: "Heritage and Values", courseCode: "AS 1010" };
const providerCatalog = buildSchoolCourseCatalog([course], [term], [providerCourse]);

function assignment(overrides: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment {
  return { id: "assignment-1", accountId: "local", title: "Read chapter", courseId: course.id, courseName: course.name, sourceType: "manual", dueAt: new Date(2026, 8, 18, 23, 59), completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now, ...overrides };
}

function event(overrides: Partial<SchoolEvent> = {}): SchoolEvent {
  return { id: "event-1", title: "Seminar", start: new Date(2026, 8, 18, 11), end: new Date(2026, 8, 18, 12), type: "meeting", source: "canvas-calendar", ...overrides };
}

function build(input: { courses?: Course[]; assignments?: SchoolPlanningAssignment[]; events?: SchoolEvent[] } = {}) {
  return buildTodayAcademicView({ courses: input.courses ?? [], term, assignments: input.assignments ?? [], events: input.events ?? [], now });
}

test("empty Today has no fabricated priorities or schedule", () => {
  const view = build();
  assert.deepEqual(view.dueTodayAssignments, []);
  assert.deepEqual(view.overdueAssignments, []);
  assert.deepEqual(view.schedule, []);
  assert.equal(view.nextAssignment, undefined);
  assert.equal(view.nextScheduleItem, undefined);
});

test("a local/manual course with no assignments remains visible in today's schedule", () => {
  const view = build({ courses: [course] });
  assert.equal(view.schedule.length, 1);
  assert.equal(view.schedule[0].kind, "class");
  assert.equal(view.schedule[0].start.getHours(), 10);
});

test("active assignment due today is prominent in due-today work", () => {
  assert.deepEqual(build({ assignments: [assignment()] }).dueTodayAssignments.map((item) => item.id), ["assignment-1"]);
});

test("overdue work is separated from due-today work", () => {
  const view = build({ assignments: [assignment({ dueAt: new Date(2026, 8, 17, 23, 59) })] });
  assert.equal(view.overdueAssignments.length, 1);
  assert.equal(view.dueTodayAssignments.length, 0);
});

test("completed, submitted, graded, and explicitly done assignments are not urgent", () => {
  const view = build({ assignments: [assignment(), assignment({ id: "submitted", completionStatus: "submitted", dueAt: new Date(2026, 8, 17) }), assignment({ id: "graded", completionStatus: "graded", dueAt: new Date(2026, 8, 17) }), assignment({ id: "done", planningStatus: "done", dueAt: new Date(2026, 8, 17) })] });
  assert.deepEqual(view.dueTodayAssignments.map((item) => item.id), ["assignment-1"]);
  assert.deepEqual(view.overdueAssignments, []);
});

test("upcoming work uses the existing seven-day planning window", () => {
  const view = build({ assignments: [assignment({ dueAt: new Date(2026, 8, 20, 13) }), assignment({ id: "later", dueAt: new Date(2026, 8, 27, 13) })] });
  assert.deepEqual(view.upcomingAssignments.map((item) => item.id), ["assignment-1"]);
});

test("today's class meeting is projected in local time", () => {
  const view = build({ courses: [course] });
  assert.equal(view.schedule[0].kind, "class");
  assert.equal(view.schedule[0].start.getHours(), 10);
});

test("today's academic events appear in the schedule", () => {
  const view = build({ events: [event()] });
  assert.equal(view.schedule.length, 1);
  assert.equal(view.schedule[0].kind, "event");
});

test("provider calendar class events are included without fabricating provider meetings", () => {
  const view = build({ events: [event({ type: "class", course: course.name, courseId: providerCourse.id })] });
  assert.equal(view.schedule.length, 1);
  assert.equal(view.schedule[0].kind, "event");
  assert.equal(view.schedule[0].start.getHours(), 11);
});

test("an exact provider class projection does not duplicate a local course meeting", () => {
  const view = build({ courses: [course], events: [event({ type: "class", course: course.name, courseId: course.id, start: new Date(2026, 8, 18, 10), end: new Date(2026, 8, 18, 10, 50) })] });
  assert.equal(view.schedule.length, 1);
  assert.equal(view.schedule[0].kind, "class");
});

test("schedule items are chronological across local meetings and academic events", () => {
  const view = build({ courses: [course], events: [event({ start: new Date(2026, 8, 18, 8), end: new Date(2026, 8, 18, 8, 30) })] });
  assert.deepEqual(view.schedule.map((item) => item.start.getHours()), [8, 10]);
});

test("assignment course navigation resolves a local canonical course", () => {
  assert.equal(resolveTodayAssignmentCourseId(assignment(), providerCatalog, [course]), course.id);
});

test("an unmatched or ambiguous assignment course is not linked", () => {
  const unmatched = assignment({ courseId: "missing", courseName: "Unknown Course" });
  assert.equal(resolveTodayAssignmentCourseId(unmatched, providerCatalog, [course]), undefined);
  const second: Course = { ...course, id: "local-course-2" };
  const ambiguousCatalog = buildSchoolCourseCatalog([course, second], [term]);
  assert.equal(resolveTodayAssignmentCourseId(assignment({ courseId: undefined }), ambiguousCatalog, [course, second]), undefined);
});

test("mixed local/provider assignment data resolves to one unified course", () => {
  assert.equal(providerCatalog.length, 1);
  assert.equal(providerCatalog[0].providerCourseIds[0], providerCourse.id);
  assert.equal(resolveTodayAssignmentCourseId(assignment({ courseId: providerCourse.id, courseName: providerCourse.name, sourceType: "canvas-api" }), providerCatalog, [course]), course.id);
  assert.equal(resolveTodayEventCourseId({ courseId: providerCourse.id }, providerCatalog), course.id);
});

test("duplicate assignment projections with shared provider URL show once", () => {
  const projection = assignment({ id: "calendar-copy", sourceType: "canvas-calendar", canvasUrl: "https://canvas.invalid/courses/1/assignments/2", externalId: "2" });
  const api = assignment({ id: "api-copy", sourceType: "canvas-api", canvasUrl: projection.canvasUrl, externalId: "2" });
  const view = build({ assignments: [projection, api] });
  assert.equal(view.assignments.length, 1);
});

test("Up Next is deterministic for a fixed clock and input", () => {
  const input = { assignments: [assignment({ id: "tomorrow", dueAt: new Date(2026, 8, 19, 12) }), assignment({ id: "today", dueAt: new Date(2026, 8, 18, 18) })] };
  assert.equal(build(input).nextAssignment?.id, build(input).nextAssignment?.id);
  assert.equal(build(input).nextAssignment?.id, "today");
});

test("local Today data remains available when provider events are unavailable", () => {
  const view = build({ courses: [course], assignments: [assignment()], events: [] });
  assert.equal(view.schedule[0].kind, "class");
  assert.equal(view.dueTodayAssignments[0].id, "assignment-1");
});

test("event course links require a unique safe identity match", () => {
  assert.equal(resolveTodayEventCourseId({ courseId: "no-such-course", course: "Heritage and Values" }, providerCatalog), undefined);
  assert.equal(resolveTodayEventCourseId({ course: "Heritage and Values" }, providerCatalog), course.id);
});
