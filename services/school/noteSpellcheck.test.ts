import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { preserveCase, scanNoteText, tokenizeNoteWords } from "./noteSpellcheck.ts";

test("tokenizes exact prose ranges and preserves Markdown structure", () => {
  assert.deepEqual(tokenizeNoteWords("Teh voltage is 12 volts."), [
    { word: "Teh", start: 0, end: 3 },
    { word: "voltage", start: 4, end: 11 },
    { word: "is", start: 12, end: 14 },
    { word: "volts", start: 18, end: 23 },
  ]);
  assert.deepEqual(tokenizeNoteWords("`teh`\n```\nteh\n```\nemail@example.com"), []);
});

test("scans deterministically and limits suggestions", () => {
  const issues = scanNoteText("Teh recieve", () => false, (word) => word === "Teh" ? ["the", "ten", "tea", "too"] : ["receive"]);
  assert.deepEqual(issues, [
    { word: "Teh", start: 0, end: 3, suggestions: ["the", "ten", "tea"] },
    { word: "recieve", start: 4, end: 11, suggestions: ["receive"] },
  ]);
  assert.equal(preserveCase("the", "teh"), "the");
  assert.equal(preserveCase("the", "Teh"), "The");
  assert.equal(preserveCase("the", "TEH"), "THE");
});
