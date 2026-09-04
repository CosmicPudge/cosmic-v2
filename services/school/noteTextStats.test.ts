import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { getTextStats } from "./noteTextStats.ts";

test("counts words and characters from note content", () => {
  assert.deepEqual(getTextStats(""), { words: 0, characters: 0 });
  assert.deepEqual(getTextStats("   \n\t  "), { words: 0, characters: 7 });
  assert.deepEqual(getTextStats("Hello"), { words: 1, characters: 5 });
  assert.deepEqual(getTextStats("Hello   world\nagain!"), { words: 3, characters: 20 });
  assert.deepEqual(getTextStats("Hello, world!"), { words: 2, characters: 13 });
  assert.deepEqual(getTextStats("## Voltage Divider\n\nCurrent entering a node"), { words: 7, characters: 43 });
});
