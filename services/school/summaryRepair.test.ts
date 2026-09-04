import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { repairSummary } from "./summaryRepair.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { SchoolSummaryRepairProviderError, SchoolSummaryValidationError } from "./summaryParser.ts";

const valid = JSON.stringify({ title: "Study note", content: "Key facts", topics: ["topic"] });

test("summary repair makes one bounded repair request and returns valid JSON", async () => {
  let calls = 0;
  let request: { context: string; messages: Array<{ role: "user"; content: string }> } | undefined;
  const result = await repairSummary({ generate: async (input) => { calls += 1; request = input; return valid; } }, "Prose output");
  assert.equal(calls, 1);
  assert.equal(result.title, "Study note");
  assert.match(request?.context ?? "", /Return JSON only/);
  assert.match(request?.messages[0]?.content ?? "", /malformed-organizer-output/);
});

test("summary repair fails cleanly when repaired output is invalid", async () => {
  await assert.rejects(() => repairSummary({ generate: async () => "not JSON" }, "Prose output"), (error: unknown) => error instanceof SchoolSummaryValidationError && error.classification === "repair_output_invalid");
});

test("summary repair distinguishes provider failure", async () => {
  await assert.rejects(() => repairSummary({ generate: async () => { throw new Error("provider failed"); } }, "Prose output"), (error: unknown) => error instanceof SchoolSummaryRepairProviderError);
});
