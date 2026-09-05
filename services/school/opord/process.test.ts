import assert from "node:assert/strict";
import test from "node:test";
import { isCurrentOpordDocument, parseAndNormalizeOpord, replaceOpordIntelligence } from "./process";

test("reprocessing replaces stale intelligence with current parsed events", () => {
  const old = parseAndNormalizeOpord({ sourceId: "source-1", sourceName: "Week 02", text: "FRIDAY 01 SEP 2026 - PT\nSituation: stale ORM event\nDate/Time: Friday (01 Sep 2026) from 0600-0700" });
  const oldStored = { ...old, parserVersion: undefined };
  const next = parseAndNormalizeOpord({ sourceId: "source-1", sourceName: "Week 02", text: `--- PAGE 1 ---\nContents Description Page #\n1. Leadership Laboratory (LLAB) Marching Basics 2\n--- PAGE 2 ---\n1. Leadership Laboratory (LLAB)\nSituation\nMarching Basics\nDate/Time\nThursday (10 Sep 2026) from 1500 to 1700\nForm-Up Location\nHPER 201\n--- PAGE 4 ---\n2- 1. Physical Training (PT) - Monday\nSituation\nLABOR DAY - NO PT\nDate/Time\nMonday (7 Sep 2026) from 0600 - 0700\nForm-Up Location\nN/A\n--- PAGE 5 ---\n2- 2. Physical Training (PT) - Wednesday\nSituation\nRunning Seminar\nDate/Time\nWednesday (9 Sep 2026) from 0600 - 0700\nForm-Up Location\nLegacy Fields\n--- PAGE 6 ---\n2- 3. Physical Training (PT) - Friday\nSituation\n343 Mentor Challenge\nDate/Time\nFriday (11 Sep 2026) from 0600 - 0700\nForm-Up Location\nLegacy Fields` });
  const replaced = replaceOpordIntelligence(old, next);
  assert.equal(replaced, next);
  assert.equal(replaced.parserVersion, "v4-real-extraction");
  assert.equal(isCurrentOpordDocument(oldStored), false);
  assert.equal(isCurrentOpordDocument(replaced), true);
  assert.equal(replaced.events.length, 4);
  assert.deepEqual(replaced.events.map((event) => event.diagnostics?.sourcePage), [2, 4, 5, 6]);
  assert.equal(replaced.events.some((event) => /ORM/i.test(event.title)), false);
});
