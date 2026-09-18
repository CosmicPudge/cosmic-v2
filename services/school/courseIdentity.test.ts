import assert from "node:assert/strict";
import test from "node:test";
import type { Course, SchoolTerm } from "@/core/contracts/School";
import { buildSchoolCourseCatalog, matchSchoolCourse } from "./courseIdentity";

const terms: SchoolTerm[] = [{ id: "fall", name: "Fall 2026", active: true }];
const course = (overrides: Partial<Course> = {}): Course => ({ id: "local-engl", code: "ENGL-1010", name: "English Composition", section: "002", termId: "fall", meetingTimes: [], ...overrides });
const canvas = { id: "42", name: "English Composition", courseCode: "ENGL1010", workflowState: "available" };

test("matches a Canvas course to a local course and preserves both identities", () => {
  const catalog = buildSchoolCourseCatalog([course()], terms, [canvas]);
  assert.equal(catalog.length, 1);
  assert.deepEqual(catalog[0].providerCourseIds, ["42"]);
  assert.deepEqual(catalog[0].sources, ["manual", "canvas-api"]);
});

test("matches Canvas assignment and calendar references deterministically", () => {
  const courses = [course()];
  assert.equal(matchSchoolCourse({ source: "canvas-api", providerCourseId: "42", courseName: canvas.name }, courses, terms, [canvas]).course?.id, "local-engl");
  assert.equal(matchSchoolCourse({ source: "canvas-calendar", courseName: "English Composition" }, courses, terms).course?.id, "local-engl");
});

test("leaves unmatched provider data explicit", () => {
  const result = matchSchoolCourse({ source: "canvas-api", courseCode: "MATH 1200", courseName: "College Algebra" }, [course()], terms);
  assert.equal(result.status, "unmatched");
  assert.equal(result.course, undefined);
});

test("fails safely when a provider reference is ambiguous", () => {
  const result = matchSchoolCourse({ source: "canvas-calendar", courseCode: "ENGL 1010" }, [course({ id: "a", section: "001" }), course({ id: "b", section: "002" })], terms);
  assert.equal(result.status, "ambiguous");
  assert.equal(result.course, undefined);
});
