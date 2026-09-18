import assert from "node:assert/strict";
import test from "node:test";
import { getSchoolSetupState, assignmentBelongsToCourse, resolveCalendarCourseFilter, timelineEntryBelongsToCourse } from "./courseExperience";
import type { Course } from "@/core/contracts/School";
import type { SchoolCourseIdentity } from "./courseIdentity";

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
});

test("calendar course filter resolves local, provider, and mixed canonical identities", () => {
  assert.equal(resolveCalendarCourseFilter("local-1", [identity]), "local-1");
  assert.equal(resolveCalendarCourseFilter("canvas:canvas-1", [{ ...identity, id: "canvas:canvas-1", localCourseId: undefined }]), "canvas:canvas-1");
  assert.equal(resolveCalendarCourseFilter(identity.id, [identity]), identity.id);
});

test("calendar course filter rejects invalid and ambiguous/unresolved requests", () => {
  assert.equal(resolveCalendarCourseFilter("missing", [identity]), "all");
  assert.equal(resolveCalendarCourseFilter("ENGL 1010", [{ ...identity, matchStatus: "ambiguous" }]), "all");
  assert.equal(resolveCalendarCourseFilter("ambiguous", []), "all");
});

test("calendar manual selector values remain independent after URL resolution", () => {
  const initial = resolveCalendarCourseFilter(identity.id, [identity]);
  assert.equal(initial, identity.id);
  assert.equal(resolveCalendarCourseFilter(undefined, [identity]), "all");
});
