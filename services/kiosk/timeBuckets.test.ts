import assert from "node:assert/strict";
import test from "node:test";
import { buildKioskTimeBuckets } from "./timeBuckets";

const now = new Date("2026-10-02T12:00:00Z");
const item = (id: string, start: string, end = start) => ({ id, start, end });

test("selects the next item and separates today from the next seven days", () => {
  const result = buildKioskTimeBuckets([
    item("later", "2026-10-05T10:00:00Z"),
    item("today", "2026-10-02T15:00:00Z"),
    item("tomorrow", "2026-10-03T09:00:00Z"),
  ], now);
  assert.equal(result.next?.id, "today");
  assert.deepEqual(result.today.map((value) => value.id), ["today"]);
  assert.deepEqual(result.week.map((value) => value.id), ["tomorrow", "later"]);
});

test("does not classify expired items as current or next", () => {
  const result = buildKioskTimeBuckets([item("expired", "2026-10-01T10:00:00Z")], now);
  assert.equal(result.next, undefined);
  assert.equal(result.today.length, 0);
  assert.equal(result.week.length, 0);
});
