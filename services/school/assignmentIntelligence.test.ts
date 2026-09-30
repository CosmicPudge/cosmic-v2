import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { normalizeSchoolAssignmentIntelligence } from "./assignmentIntelligence.ts";

test("normalizes a complete provider-neutral assignment intelligence object", () => {
  const result = normalizeSchoolAssignmentIntelligence({
    summary: "Write and submit a short analysis.",
    requirements: [{ text: "Use two primary sources.", kind: "material", completed: false }],
    deliverables: [{ text: "Upload a PDF", format: "PDF" }],
    estimatedMinutes: 90,
    effortCategory: "moderate",
    suggestedSteps: [{ text: "Draft an outline", order: 1, estimatedMinutes: 20 }, { text: "Revise", order: 2, estimatedMinutes: 30 }],
    studyTopics: ["primary-source analysis"],
    ambiguities: [{ text: "The rubric is referenced but not attached.", severity: "medium", category: "grading" }],
    warnings: [{ text: "The required file format should be confirmed.", severity: "low" }],
    confidence: 0.8,
    source: "deterministic",
  });
  assert.equal(result?.summary, "Write and submit a short analysis.");
  assert.equal(result?.requirements[0]?.kind, "material");
  assert.equal(result?.deliverables[0]?.format, "PDF");
  assert.deepEqual(result?.suggestedSteps.map((item) => item.text), ["Draft an outline", "Revise"]);
  assert.equal(result?.studyTopics[0], "primary-source analysis");
  assert.equal(result?.ambiguities[0]?.severity, "medium");
  assert.equal(result?.warnings[0]?.category, undefined);
  assert.equal(result?.confidence, 0.8);
});

test("supports partial intelligence and deterministic IDs without inventing content", () => {
  const result = normalizeSchoolAssignmentIntelligence({ requirements: [{ text: "Read Chapter 4", kind: "material" }], suggestedSteps: [{ text: "Review notes", order: 0 }] });
  assert.equal(result?.requirements.length, 1);
  assert.match(result?.requirements[0]?.id ?? "", /^requirement:/);
  assert.deepEqual(result?.deliverables, []);
  assert.equal(result?.estimatedMinutes, undefined);
});

test("filters malformed items and normalizes unsafe bounds", () => {
  const result = normalizeSchoolAssignmentIntelligence({
    requirements: [{ text: "" }, { text: "Keep this", kind: "unknown" }, "bad"],
    deliverables: [{ format: "PDF" }],
    suggestedSteps: [{ text: "Invalid duration", estimatedMinutes: -20, order: 2 }, { text: "Valid", estimatedMinutes: 30, order: 1 }],
    studyTopics: ["", "Stoichiometry", 42],
    ambiguities: [{ text: "Check", severity: "invalid" }],
    warnings: [{ text: "Warning", severity: "high" }],
    estimatedMinutes: -5,
    confidence: 4,
  });
  assert.equal(result?.requirements.length, 1);
  assert.equal(result?.deliverables.length, 0);
  assert.deepEqual(result?.suggestedSteps.map((item) => [item.text, item.estimatedMinutes]), [["Valid", 30], ["Invalid duration", undefined]]);
  assert.deepEqual(result?.studyTopics, ["Stoichiometry"]);
  assert.equal(result?.ambiguities[0]?.severity, "medium");
  assert.equal(result?.warnings[0]?.severity, "high");
  assert.equal(result?.estimatedMinutes, undefined);
  assert.equal(result?.confidence, 1);
});

test("rejects non-object intelligence values without throwing", () => {
  assert.equal(normalizeSchoolAssignmentIntelligence(null), undefined);
  assert.equal(normalizeSchoolAssignmentIntelligence("not intelligence"), undefined);
});
