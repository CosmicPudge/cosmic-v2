import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { classifyAcademicWork } from "./academicWork.ts";

test("academic classification uses explicit event types and conservative token boundaries", () => {
  assert.deepEqual(classifyAcademicWork({ title: "Examining Engineering Ethics", description: "" }), { type: "assignment", confidence: "unknown" });
  assert.deepEqual(classifyAcademicWork({ title: "Exam 2", description: "" }), { type: "exam", confidence: "pattern" });
  assert.deepEqual(classifyAcademicWork({ title: "Weekly assessment", description: "", type: "quiz" }), { type: "quiz", confidence: "explicit" });
});
