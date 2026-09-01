import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { applyAuthoritativeCourse, isValidSchoolCourseId } from "./courseOverride.ts";

test("authoritative course replaces advisory course without losing finding data", () => {
  assert.deepEqual(applyAuthoritativeCourse({ title: "Quiz", courseId: "detected" }, "math-1060"), { title: "Quiz", courseId: "math-1060" });
});
test("unknown course remains unset and invalid IDs are rejected", () => {
  assert.deepEqual(applyAuthoritativeCourse({ title: "Note" }, null), { title: "Note" });
  assert.equal(isValidSchoolCourseId(""), false); assert.equal(isValidSchoolCourseId("bad id"), false); assert.equal(isValidSchoolCourseId("math-1060"), true);
});
