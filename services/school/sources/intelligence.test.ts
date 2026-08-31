import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { createSchoolSource } from "../intelligence.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { extractDocumentIntelligence } from "./intelligence.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { detectSourceConflicts } from "./conflicts.ts";

const source = createSchoolSource({ id: "source-1", accountId: "account-1", type: "upload-text", title: "AFROTC guide", importedAt: "2026-08-30T00:00:00.000Z" });

test("extracts explicit LLAB details without guessing a date", () => {
  const result = extractDocumentIntelligence(source, "LLAB is Thursday at 0630 in the HPER Fieldhouse. Wear PTGs and bring a water bottle.");
  assert.equal(result.events[0]?.title, "LLAB");
  assert.equal(result.events[0]?.action, "Report at 06:30");
  assert.equal(result.events[0]?.location?.name, "HPER Fieldhouse");
  assert.equal(result.events[0]?.attire?.value, "PTGs");
  assert.deepEqual(result.events[0]?.requiredItems, ["a water bottle"]);
  assert.equal(result.events[0]?.startsAt, undefined);
});

test("preserves missing and TBD uniform semantics", () => {
  const missing = extractDocumentIntelligence(source, "LLAB is Thursday at 0630.");
  const tbd = extractDocumentIntelligence(source, "Uniform: TBD");
  assert.equal(missing.facts.some((fact) => fact.kind === "attire"), false);
  assert.equal(tbd.facts.find((fact) => fact.kind === "uniform" || fact.kind === "attire")?.value, "TBD");
});

test("resolves only an explicitly supplied calendar date", () => {
  const result = extractDocumentIntelligence(source, "LLAB is 2026-09-03 at 0630 in the HPER Fieldhouse.");
  assert.equal(result.events[0]?.startsAt, "2026-09-03T06:30:00.000Z");
});

test("detects conservative cross-source event conflicts", () => {
  const first = extractDocumentIntelligence(source, "LLAB 2026-09-03 at 0600 in HPER.").events[0]!;
  const second = extractDocumentIntelligence({ ...source, id: "source-2", title: "Updated guide" }, "LLAB 2026-09-03 at 0630 in Fieldhouse.").events[0]!;
  assert.equal(detectSourceConflicts([first, second]).length, 1);
});
