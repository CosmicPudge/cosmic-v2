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

test("keeps Up Next when the assignment is next week and the other buckets are empty", () => {
  const result = buildKioskTimeBuckets([
    item("next-week", "2026-10-12T09:00:00Z", "2026-10-12T10:00:00Z"),
  ], now);
  assert.equal(result.next?.id, "next-week");
  assert.deepEqual(result.today, []);
  assert.deepEqual(result.week, []);
});

test("includes every due-today assignment and the remaining weekly work", () => {
  const result = buildKioskTimeBuckets([
    item("today-one", "2026-10-02T13:00:00Z", "2026-10-02T14:00:00Z"),
    item("today-two", "2026-10-02T16:00:00Z", "2026-10-02T17:00:00Z"),
    item("this-week", "2026-10-06T09:00:00Z", "2026-10-06T10:00:00Z"),
  ], now);
  assert.deepEqual(result.today.map((value) => value.id), ["today-one", "today-two"]);
  assert.deepEqual(result.week.map((value) => value.id), ["this-week"]);
});

test("selects the next remaining assignment after completion filtering", () => {
  const active = filterKioskSchoolAssignments([
    { id: "completed", due: "2026-10-07T09:00:00Z", completed: false },
    { id: "remaining", due: "2026-10-08T09:00:00Z", completed: false },
  ], new Set(["completed"]), now);
  const result = buildKioskTimeBuckets(active.map((assignment) => ({
    ...assignment,
    start: assignment.due,
    end: new Date(new Date(assignment.due).getTime() + 60 * 60 * 1000).toISOString(),
  })), now);
  assert.equal(result.next?.id, "remaining");
});
