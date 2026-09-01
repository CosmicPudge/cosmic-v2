import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { policyConflict, requirementConflict } from "./conflicts.ts";

const finding = (value: string, overrides: Record<string, unknown> = {}) => ({ id: value, sourceId: "source", type: "requirement", payload: { courseId: "math", requirementCategory: "wear", relevantDate: "2026-09-10", value, ...overrides }, evidence: `Wear ${value}`, reviewState: "approved" });
test("different wear values in the same slot conflict", () => assert.equal(requirementConflict(finding("PTGs"), { ...finding("OCPs"), sourceId: "new", reviewState: "pending" }), true));
test("additive bring values and unrelated slots do not conflict", () => { assert.equal(requirementConflict(finding("calculator", { requirementCategory: "bring" }), finding("notebook", { requirementCategory: "bring" })), false); assert.equal(requirementConflict(finding("PTGs"), finding("OCPs", { courseId: "chem" })), false); });
test("policy conflict uses subject and course", () => { const a = { ...finding("allowed", { subject: "calculator_policy" }), type: "policy" }; const b = { ...finding("not allowed", { subject: "calculator_policy" }), type: "policy", sourceId: "new", reviewState: "pending" }; assert.equal(policyConflict(a, b), true); });
