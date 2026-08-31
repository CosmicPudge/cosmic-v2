import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { extractWithAIFromProvider, mergeSchoolIntelligence, validateAIResult } from "./aiExtract.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { createSchoolSource } from "../intelligence.ts";

const source = createSchoolSource({ id: "source-ai-1", accountId: "account-1", type: "upload-text", title: "AFROTC guide", importedAt: "2026-08-30T00:00:00.000Z" });
const text = "LLAB is Thursday at 0630 in the HPER Fieldhouse. Wear PTGs and bring a water bottle.";

test("accepts explicit AI evidence and preserves structured school details", () => {
  const result = validateAIResult(source, text, {
    facts: [{ field: "uniform", subject: "uniform", value: "PTGs", certainty: "explicit", evidence: "Wear PTGs" }],
    events: [{ title: "LLAB", dayOfWeek: "Thursday", startTime: "0630", location: "HPER Fieldhouse", attire: "PTGs", requiredItems: ["a water bottle"], certainty: "explicit", evidence: "LLAB is Thursday at 0630 in the HPER Fieldhouse. Wear PTGs and bring a water bottle." }],
    actionItems: [{ title: "Bring a water bottle", certainty: "explicit", evidence: "bring a water bottle" }],
  });
  assert.equal(result.events[0]?.title, "LLAB");
  assert.equal(result.events[0]?.startsAt, undefined);
  assert.equal(result.events[0]?.location?.name, "HPER Fieldhouse");
  assert.equal(result.events[0]?.attire?.value, "PTGs");
  assert.equal(result.actionItems[0]?.title, "Bring a water bottle");
  assert.equal(result.facts[0]?.provenance[0]?.extractor, "ai");
});

test("rejects unsupported or unverifiable AI claims", () => {
  const result = validateAIResult(source, "Uniform: TBD", {
    facts: [
      { field: "uniform", value: "OCP", certainty: "explicit", evidence: "Wear OCPs tomorrow" },
      { field: "uniform", value: "TBD", certainty: "explicit", evidence: "Uniform: TBD" },
    ],
    events: [],
    actionItems: [],
  });
  assert.equal(result.facts.length, 1);
  assert.equal(result.facts[0]?.value, "TBD");
  assert.ok(result.warnings.length > 0);
});

test("reconciles matching events without duplicating and preserves conflicts", () => {
  const deterministic = validateAIResult(source, text, { facts: [], events: [{ title: "LLAB", startsAt: "2026-09-03T06:30:00.000Z", certainty: "explicit", evidence: "LLAB is Thursday at 0630 in the HPER Fieldhouse." }], actionItems: [], conflicts: [], warnings: [] });
  const ai = validateAIResult(source, text, { facts: [], events: [{ title: "LLAB", startsAt: "2026-09-03T06:00:00.000Z", certainty: "explicit", evidence: "LLAB is Thursday at 0630 in the HPER Fieldhouse." }], actionItems: [], conflicts: [], warnings: [] });
  const merged = mergeSchoolIntelligence(deterministic, ai);
  assert.equal(merged.events.length, 1);
  assert.equal(merged.events[0]?.startsAt, "2026-09-03T06:30:00.000Z");
  assert.equal(merged.conflicts.length, 1);
});

test("malformed AI output is rejected safely", () => {
  assert.throws(() => validateAIResult(source, text, null), /invalid structured response/);
});

test("uses the provider boundary for a successful explicit extraction without a network call", async () => {
  const result = await extractWithAIFromProvider(source, text, { generate: async () => JSON.stringify({ facts: [{ field: "uniform", value: "PTGs", certainty: "explicit", evidence: "Wear PTGs" }], events: [{ title: "LLAB", dayOfWeek: "Thursday", startTime: "0630", location: "HPER Fieldhouse", certainty: "explicit", evidence: "LLAB is Thursday at 0630 in the HPER Fieldhouse." }], actionItems: [] }) });
  assert.equal(result.facts[0]?.value, "PTGs");
  assert.equal(result.events[0]?.title, "LLAB");
});

test("classifies malformed provider output without exposing provider content", async () => {
  await assert.rejects(() => extractWithAIFromProvider(source, text, { generate: async () => "not-json" }), /malformed structured data/);
});
