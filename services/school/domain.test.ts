import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildSchoolSnapshot, schoolEventCalendarKey } from "./domain.ts";

const event = {
  id: "canvas-event-1",
  title: "Reading Response 8",
  start: new Date("2026-09-01T12:00:00Z"),
  end: new Date("2026-09-01T13:00:00Z"),
  type: "assignment" as const,
  source: "canvas-calendar" as const,
};

const data = {
  mission: { title: "Study", subtitle: "", priority: "medium" as const },
  focus: { title: "Reading Response 8", priority: "medium" as const, progress: 0, estimatedMinutes: 30, reason: "Due soon" },
  headline: "School",
  status: "Ready",
  timeline: [],
  stats: { classesToday: 0, assignmentsDueToday: 0, afrotcEvents: 0 },
  semester: { semester: "Fall", week: 1, progress: 0 },
  events: [event, event],
  classes: [],
  assignments: [{ id: "canvas-event-1", title: event.title, due: event.end, completed: false, priority: "medium" as const, source: "canvas" as const }],
  announcements: [],
};

test("normalizes a deduplicated, credential-free School snapshot", () => {
  const snapshot = buildSchoolSnapshot(data, new Date("2026-08-30T00:00:00Z"));
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.assignments.length, 1);
  assert.equal(snapshot.actionItems.length, 1);
  assert.deepEqual(snapshot.sources, [{ source: "canvas-calendar", eventCount: 1, assignmentCount: 1 }]);
  assert.equal(snapshot.updatedAt, "2026-08-30T00:00:00.000Z");
  assert.equal(schoolEventCalendarKey(event), "canvas-calendar:canvas-event-1");
  assert.equal("feedUrl" in snapshot, false);
});
