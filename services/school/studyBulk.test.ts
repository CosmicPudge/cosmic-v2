import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { parseBulkCards } from "./studyBulk.ts";

test("bulk study card parsing supports tabs and pipes", () => {
    assert.deepEqual(parseBulkCards("One\tFirst answer\nTwo | Second answer").cards, [
      { front: "One", back: "First answer" },
      { front: "Two", back: "Second answer" },
    ]);
});

test("bulk study card parsing reports malformed rows without discarding valid rows", () => {
    const result = parseBulkCards("Valid | Answer\nMissing separator");
    assert.equal(result.cards.length, 1);
    assert.deepEqual(result.invalidRows, [{ line: 2, value: "Missing separator" }]);
});
