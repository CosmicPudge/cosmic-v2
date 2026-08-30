import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { createSchoolSource, extractExplicitSchoolFacts } from "./intelligence.ts";

const source = createSchoolSource({ id: "source-1", accountId: "account-1", type: "upload-text", title: "AFROTC notes", importedAt: "2026-08-29T00:00:00.000Z" });

test("extracts only explicitly labeled facts with provenance", () => {
  const result = extractExplicitSchoolFacts(source, "Course: AS 101\nLocation: HPER Field\nRequirement: TBD");
  assert.deepEqual(result.facts.map((fact) => [fact.kind, fact.value, fact.certainty]), [["course", "AS 101", "explicit"], ["location", "HPER Field", "explicit"], ["requirement", "TBD", "explicit"]]);
  assert.equal(result.facts[0].provenance[0].sourceId, "source-1");
  assert.equal(result.requiresValidation, true);
});

test("does not guess unstructured or unspecified values", () => {
  const result = extractExplicitSchoolFacts(source, "Next milestone: not specified\nPTGs may be Thursday");
  assert.deepEqual(result.facts, []);
  assert.deepEqual(result.warnings, ["Source contains an unspecified value; no value was inferred."]);
});
