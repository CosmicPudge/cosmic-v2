import test from "node:test";
import assert from "node:assert/strict";
import type { Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { SchoolEvent } from "@/components/school/data/types";
import { emptyLocalSchoolData, normalizeLocalSchoolData } from "@/components/school/data/localDataHydration";
import { buildSchoolCourseCatalog } from "./courseIdentity";
import { localAssignmentToPlanning } from "./semesterConsumers";
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

test("empty Today has no fabricated priorities, schedule, Study reviews, or next step", () => {
  const view = build();
  assert.deepEqual(view.dueTodayAssignments, []);
  assert.deepEqual(view.overdueAssignments, []);
  assert.deepEqual(view.needsAttentionAssignments, []);
  assert.deepEqual(view.schedule, []);
  assert.deepEqual(view.studyReviews, []);
  assert.equal(view.nextStep, undefined);
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

test("Due Soon work uses the existing assignment workload bucket", () => {
  const view = build({ assignments: [assignment({ dueAt: new Date(2026, 8, 20, 13) }), assignment({ id: "later", dueAt: new Date(2026, 8, 27, 13) })] });
  assert.deepEqual(view.dueSoonAssignments.map((item) => item.id), ["assignment-1"]);
  assert.deepEqual(view.comingUpAssignments.map((item) => item.id), []);
  assert.equal(view.nextStep?.kind, "deadline");
});

test("undated planner suggestions do not imply a deadline", () => {
  const view = build({ assignments: [assignment({ dueAt: undefined })] });
  assert.equal(view.nextStep?.kind, "planner");
  if (view.nextStep?.kind === "planner") assert.equal(view.nextStep.reason, "No due date recorded");
});

test("existing planner recommendation is reused before Study when no deadline is available", () => {
  const item = assignment({ id: "undated", dueAt: undefined });
  const view = buildTodayAcademicView({ courses: [], assignments: [item], events: [], planningRecommendations: [{ assignmentId: item.id, title: item.title, score: 15, reason: "Review before class" }], studySets: [{ id: "set", title: "Study", createdAt: now, updatedAt: now }], flashcards: [{ id: "card", setId: "set", front: "Q", back: "A", reviewCount: 1, intervalDays: 1, lastReviewedAt: new Date(2026, 8, 17), nextReviewAt: now, createdAt: now, updatedAt: now }], now });
  assert.equal(view.nextStep?.kind, "planner");
  if (view.nextStep?.kind === "planner") {
    assert.equal(view.nextStep.item.id, item.id);
    assert.equal(view.nextStep.reason, "No due date recorded");
  }
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

test("future academic events stay out of Today's Schedule and appear in Coming Up", () => {
  const future = event({ id: "future-event", title: "Study group", start: new Date(2026, 8, 19, 11), end: new Date(2026, 8, 19, 12) });
  const view = build({ events: [future] });
  assert.deepEqual(view.schedule, []);
  assert.equal(view.comingSchedule.length, 1);
  assert.equal(view.comingSchedule[0].kind, "event");
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
  assert.equal(view.needsAttentionAssignments.length, 1);
});

test("Up Next prioritizes attention, then the nearest dated work, deterministically", () => {
  const input = { assignments: [assignment({ id: "tomorrow", dueAt: new Date(2026, 8, 19, 12) }), assignment({ id: "today", dueAt: new Date(2026, 8, 18, 18) }), assignment({ id: "overdue", dueAt: new Date(2026, 8, 17, 18) })] };
  const first = build(input).nextStep;
  assert.deepEqual(first, build(input).nextStep);
  assert.equal(first?.kind, "attention");
  if (first?.kind === "attention") assert.equal(first.item.id, "overdue");
});

test("local Today data remains available when provider events are unavailable", () => {
  const view = build({ courses: [course], assignments: [assignment()], events: [] });
  assert.equal(view.schedule[0].kind, "class");
  assert.equal(view.dueTodayAssignments[0].id, "assignment-1");
});

test("provider-unavailable state does not discard available local data", () => {
  const view = buildTodayAcademicView({ courses: [course], term, assignments: [assignment()], events: [], providerUnavailable: true, now });
  assert.equal(view.providerUnavailable, true);
  assert.equal(view.needsAttentionAssignments[0].id, "assignment-1");
  assert.equal(view.schedule.length, 1);
});

test("Study review counts include reviewed due cards but not new or future cards", () => {
  const sets = [{ id: "set-1", title: "Test Review", courseId: course.id, createdAt: now, updatedAt: now }, { id: "set-2", title: "Future Review", createdAt: now, updatedAt: now }];
  const cards = [
    { id: "due-1", setId: "set-1", front: "Q", back: "A", reviewCount: 1, intervalDays: 1, lastReviewedAt: new Date(2026, 8, 17, 9), nextReviewAt: new Date(2026, 8, 18, 8), createdAt: now, updatedAt: now },
    { id: "due-2", setId: "set-1", front: "Q2", back: "A2", reviewCount: 1, intervalDays: 1, lastReviewedAt: new Date(2026, 8, 17, 9), nextReviewAt: new Date(2026, 8, 18, 8), createdAt: now, updatedAt: now },
    { id: "new", setId: "set-1", front: "Q3", back: "A3", reviewCount: 0, intervalDays: 0, lastReviewedAt: null, nextReviewAt: null, createdAt: now, updatedAt: now },
    { id: "future", setId: "set-2", front: "Q4", back: "A4", reviewCount: 1, intervalDays: 3, lastReviewedAt: new Date(2026, 8, 17, 9), nextReviewAt: new Date(2026, 8, 20, 9), createdAt: now, updatedAt: now },
  ];
  const view = buildTodayAcademicView({ courses: [course], term, assignments: [], events: [], studySets: sets, flashcards: cards, now });
  assert.equal(view.totalStudyReviewsDue, 2);
  assert.deepEqual(view.studyReviews.map((item) => [item.title, item.dueCount, item.courseName]), [["Test Review", 2, "AS 1010 · Heritage and Values"]]);
  assert.equal(view.nextStep?.kind, "study");
});

test("no Study review due creates no Study recommendation", () => {
  const view = buildTodayAcademicView({ courses: [], assignments: [], events: [], studySets: [{ id: "set", title: "Future", createdAt: now, updatedAt: now }], flashcards: [{ id: "card", setId: "set", front: "Q", back: "A", reviewCount: 1, intervalDays: 4, lastReviewedAt: now, nextReviewAt: new Date(2026, 8, 22), createdAt: now, updatedAt: now }], now });
  assert.equal(view.totalStudyReviewsDue, 0);
  assert.deepEqual(view.studyReviews, []);
  assert.equal(view.nextStep, undefined);
});

test("local calendar-day boundaries keep just-after-midnight due dates in today's bucket", () => {
  const view = build({ assignments: [assignment({ id: "midnight", dueAt: new Date(2026, 8, 18, 0, 1) }), assignment({ id: "yesterday", dueAt: new Date(2026, 8, 17, 23, 59) })] });
  assert.deepEqual(view.dueTodayAssignments.map((item) => item.id), ["midnight"]);
  assert.deepEqual(view.overdueAssignments.map((item) => item.id), ["yesterday"]);
});

test("ISO-hydrated local assignment dates enter the same Today selectors", () => {
  const raw = { ...emptyLocalSchoolData, terms: [term], courses: [course], assignments: [{ id: "iso-assignment", title: "Hydrated reading", courseId: course.id, dueAt: "2026-09-18T23:59:00.000Z", status: "upcoming", priority: "medium", source: "manual" }] };
  const hydrated = normalizeLocalSchoolData(JSON.parse(JSON.stringify(raw)));
  const planning = hydrated.assignments.map((item) => localAssignmentToPlanning(item, course));
  const view = buildTodayAcademicView({ courses: hydrated.courses, term, assignments: planning, events: [], now });
  assert.ok(hydrated.assignments[0].dueAt instanceof Date);
  assert.deepEqual(view.dueTodayAssignments.map((item) => item.id), ["manual:iso-assignment"]);
});

test("event course links require a unique safe identity match", () => {
  assert.equal(resolveTodayEventCourseId({ courseId: "no-such-course", course: "Heritage and Values" }, providerCatalog), undefined);
  assert.equal(resolveTodayEventCourseId({ course: "Heritage and Values" }, providerCatalog), course.id);
});
