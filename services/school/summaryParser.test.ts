import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { parseOrganizedAudioNote, SchoolSummaryValidationError } from "./summaryParser.ts";

const valid = JSON.stringify({ title: "Study note", content: "Key facts", topics: ["topic"] });

test("summary parser accepts plain and fenced JSON", () => {
  assert.equal(parseOrganizedAudioNote(valid).title, "Study note");
  assert.equal(parseOrganizedAudioNote("```json\n" + valid + "\n```").topics[0], "topic");
  assert.equal(parseOrganizedAudioNote(`Model response:\n${valid}\nEnd.`).content, "Key facts");
});

test("summary parser reports validation failure separately from provider failure", () => {
  assert.throws(() => parseOrganizedAudioNote(JSON.stringify({ summary: "wrong shape" })), (error: unknown) => error instanceof SchoolSummaryValidationError && error.issuePaths.includes("title") && error.issuePaths.includes("content"));
});
