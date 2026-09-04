import assert from "node:assert/strict";
import test from "node:test";
import type { Course, SchoolTerm } from "@/core/contracts/School";
import { normalizeCourseCode, parseCanvasCourseDescriptor, resolveCanvasAssignment, resolveSchoolPlanningAssignments } from "./courseResolution";

const term: SchoolTerm = { id: "fall", name: "Fall 2026", startDate: new Date("2026-08-24"), endDate: new Date("2026-12-18"), active: true };
const course = (overrides: Partial<Course> = {}): Course => ({ id: "engl", code: "ENGL-1010", name: "English Composition", section: "002", termId: "fall", meetingTimes: [], ...overrides });

test("parses supported Canvas title descriptors and keeps provider suffix metadata", () => {
  const result = parseCanvasCourseDescriptor("Reading Response 1 [Fall 2026 ENGL-1010-002 XL]");
  assert.deepEqual(result, { raw: "[Fall 2026 ENGL-1010-002 XL]", termName: "Fall 2026", courseCode: "ENGL 1010", section: "002", providerSuffix: "XL" });
  assert.equal(parseCanvasCourseDescriptor("Read Chapter 4 [Chapter 4]"), undefined);
});

test("normalizes equivalent course code spellings", () => {
  assert.equal(normalizeCourseCode("engr-1010"), "ENGR 1010");
  assert.equal(normalizeCourseCode("ENGR1010"), "ENGR 1010");
  assert.equal(normalizeCourseCode("ENGR 1010"), "ENGR 1010");
});

test("resolves by exact term and section, with safe ambiguity behavior", () => {
  const resolved = resolveCanvasAssignment("Reading Response 1 [Fall 2026 ENGL-1010-002]", [course()], [term]);
  assert.equal(resolved?.course?.id, "engl");
  assert.equal(resolved?.displayTitle, "Reading Response 1");
  assert.equal(resolved?.rawTitle, "Reading Response 1 [Fall 2026 ENGL-1010-002]");
  assert.equal(resolveCanvasAssignment("Reading Response 1 [Fall 2026 ENGL-1010-003]", [course(), course({ id: "engl-003", section: "003" })], [term])?.course?.id, "engl-003");
  assert.equal(resolveCanvasAssignment("Reading Response 1 [Fall 2026 ENGL-1010]", [course(), course({ id: "engl-003", section: "003" })], [term])?.course, undefined);
});

test("does not infer manual assignments and keeps provider identity stable", () => {
  const manual = { id: "manual:one", accountId: "local", title: "Study for chemistry quiz", sourceType: "manual" as const, completionStatus: "upcoming" as const, planningStatus: "not_started" as const, priority: "normal" as const, createdAt: new Date(0), updatedAt: new Date(0) };
  const canvas = { ...manual, id: "canvas-calendar:one", title: "Quiz [Fall 2026 ENGL1010-002 XL]", sourceType: "canvas-calendar" as const };
  const result = resolveSchoolPlanningAssignments([manual, canvas], [course()], [term]);
  assert.equal(result[0].title, "Study for chemistry quiz");
  assert.equal(result[1].id, "canvas-calendar:one");
  assert.equal(result[1].title, "Quiz");
  assert.equal(result[1].rawTitle, canvas.title);
});

test("uses the unique active course for a missing local term match", () => {
  assert.equal(resolveCanvasAssignment("Quiz [Spring 2027 ENGR1010-001]", [course({ id: "engr", code: "ENGR1010", section: "001" })], [term])?.course?.id, "engr");
});
