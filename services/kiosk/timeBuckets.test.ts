import assert from "node:assert/strict";
import test from "node:test";
import { buildKioskTimeBuckets, filterKioskSchoolAssignments, formatKioskSchoolDue } from "./timeBuckets";

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

test("filters completed and historical school work without creating overdue iCal state", () => {
  const result = filterKioskSchoolAssignments([
    { id: "today", due: "2026-10-02T23:59:00Z", completed: false },
    { id: "done", due: "2026-10-03T10:00:00Z", completed: false },
    { id: "historical", due: "2026-10-01T10:00:00Z", completed: false },
  ], new Set(["done"]), now);
  assert.deepEqual(result.map((item) => item.id), ["today"]);
});

test("formats explicit school dates and date-only deadlines safely", () => {
  assert.match(formatKioskSchoolDue("2026-10-07T08:30:00"), /Wed, Oct 7 · 8:30 AM/);
  assert.equal(formatKioskSchoolDue("2026-10-12T00:00:00"), "Mon, Oct 12");
});

test("uses local calendar-day boundaries for date-only work", () => {
  const boundary = new Date(2026, 9, 2, 23, 30);
  const result = filterKioskSchoolAssignments([{ id: "boundary", due: new Date(2026, 9, 3, 0, 15).toISOString(), completed: false }], new Set(), boundary);
  assert.equal(result.length, 1);
});
