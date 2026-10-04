import assert from "node:assert/strict";
import test from "node:test";
import { footballContextPriority } from "./contextPriority";

test("football context priority keeps attention states ahead of rotation", () => {
  assert.deepEqual(footballContextPriority("review").slice(0, 2), ["review", "team-stats"]);
  assert.equal(footballContextPriority("halftime")[0], "team-stats");
  assert.equal(footballContextPriority("final")[0], "linescore");
});
