import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildCoursePlans, classifySchoolSourcePurpose } from "./coursePlan.ts";

test("classifies syllabus sources conservatively", () => assert.equal(classifySchoolSourcePurpose("MATH 1060 syllabus"), "syllabus"));
test("builds bounded approved course plan knowledge", () => {
  const plans = buildCoursePlans([{ sourceId: "source-1", type: "fact", reviewState: "approved", payload: { courseId: "math", subject: "late_work_policy", value: "Accepted within 48 hours" } }, { sourceId: "source-1", type: "fact", reviewState: "pending", payload: { courseId: "math", subject: "attendance", value: "Required" } }], new Map([["source-1", "math"]]));
  assert.equal(plans.length, 1); assert.equal(plans[0]?.policies.length, 1); assert.equal(plans[0]?.policies[0]?.value, "Accepted within 48 hours");
});
