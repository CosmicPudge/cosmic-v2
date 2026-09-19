import assert from "node:assert/strict";
import test from "node:test";
import { getSchoolSetupState, assignmentBelongsToCourse, calendarCourseFilterSelection, resolveCalendarCourseFilter, timelineEntryBelongsToCourse } from "./courseExperience";
import type { Course } from "@/core/contracts/School";
import { buildSchoolCourseCatalog, type SchoolCourseIdentity } from "./courseIdentity";

const course: Course = { id: "local-1", code: "BIO 1010", name: "Biology", termId: "term-1", meetingTimes: [] };
const identity: SchoolCourseIdentity = { id: course.id, name: course.name, code: course.code, localCourseId: course.id, providerCourseIds: ["canvas-1"], sources: ["manual", "canvas-api"], matchStatus: "matched" };

test("school course experience distinguishes setup states", () => {
  const empty = { terms: [], courses: [], assignments: [] };
  assert.equal(getSchoolSetupState(empty, { sourceStatus: { canvas: "not_connected" }, canvasCourses: [], planningAssignments: [], events: [] }), "not_connected");
  assert.equal(getSchoolSetupState({ ...empty, courses: [course] }, { sourceStatus: { canvas: "not_connected" }, canvasCourses: [], planningAssignments: [], events: [] }), "ready");
  assert.equal(getSchoolSetupState(empty, { sourceStatus: { canvas: "healthy" }, canvasCourses: [{ id: "canvas-1", name: "Biology" }], planningAssignments: [], events: [] }), "partially_connected");
  assert.equal(getSchoolSetupState({ ...empty, courses: [course] }, { sourceStatus: { canvas: "healthy" }, canvasCourses: [{ id: "canvas-1", name: "Biology" }], planningAssignments: [], events: [] }), "ready");
  assert.equal(getSchoolSetupState(empty, { sourceStatus: { canvas: "error" }, canvasCourses: [], planningAssignments: [], events: [] }), "provider_error");
});

test("school course experience matches provider and name references safely", () => {
  assert.equal(assignmentBelongsToCourse({ courseId: "canvas-1" }, identity, course), true);
  assert.equal(assignmentBelongsToCourse({ courseName: "BIO-1010" }, identity, course), true);
  assert.equal(assignmentBelongsToCourse({ courseName: "Chemistry" }, identity, course), false);
  assert.equal(timelineEntryBelongsToCourse({ sourceId: "canvas-1" }, identity), true);
  assert.equal(timelineEntryBelongsToCourse({ courseName: "Biology" }, identity), true);
});

test("calendar course filter preserves all-courses behavior without a request", () => {
  assert.equal(resolveCalendarCourseFilter(undefined, [identity]), "all");
  assert.equal(resolveCalendarCourseFilter(null, [identity]), "all");
  assert.equal(calendarCourseFilterSelection(null, [identity], false), "all");
  assert.equal(calendarCourseFilterSelection(null, [identity], true), "all");
});

test("calendar course filter resolves immediately when the requested course is already present", () => {
  assert.equal(calendarCourseFilterSelection("local-1", [identity], true), "local-1");
});

test("calendar waits for local storage hydration before resolving a requested local UUID", () => {
  const requestedId = "bf59264a-d2c2-4cb0-9bf8-062754667dfd";
  const initiallyEmpty: SchoolCourseIdentity[] = [];
  assert.equal(calendarCourseFilterSelection(requestedId, initiallyEmpty, false), "all");
  const hydratedCourse: Course = { id: requestedId, code: "AS 1010", name: "Heritage and Values", termId: "fall-2026", meetingTimes: [] };
  const hydratedCatalog = buildSchoolCourseCatalog([hydratedCourse], [], []);
  assert.equal(hydratedCatalog[0].id, requestedId);
  assert.equal(calendarCourseFilterSelection(requestedId, hydratedCatalog, true), requestedId);
});

test("calendar safely falls back after hydration when a requested course is absent", () => {
  assert.equal(calendarCourseFilterSelection("missing", [identity], false), "all");
  assert.equal(calendarCourseFilterSelection("missing", [identity], true), "all");
  assert.equal(resolveCalendarCourseFilter("ENGL 1010", [{ ...identity, matchStatus: "ambiguous" }]), "all");
  assert.equal(resolveCalendarCourseFilter("ambiguous", []), "all");
});

test("calendar resolves provider and mixed canonical identities", () => {
  const providerIdentity = { ...identity, id: "canvas:canvas-1", localCourseId: undefined };
  assert.equal(calendarCourseFilterSelection("canvas:canvas-1", [providerIdentity], true), "canvas:canvas-1");
  assert.equal(calendarCourseFilterSelection(identity.id, [identity], true), identity.id);
});

test("calendar manual selector values remain independent after URL resolution", () => {
  assert.equal(calendarCourseFilterSelection(identity.id, [identity], false, "all"), "all");
  assert.equal(calendarCourseFilterSelection(identity.id, [identity], true, "all"), "all");
  assert.equal(calendarCourseFilterSelection(identity.id, [identity], true, "other-course"), "other-course");
});
