import assert from "node:assert/strict";
import test from "node:test";
import type { CalendarEvent } from "@/core/contracts";
import { selectCalendarPreEventAlert } from "./calendarAttention";

const start = new Date("2026-10-02T22:24:00Z");
function event(): CalendarEvent {
  return { id: "event-1", title: "Briefing", start, end: new Date(start.getTime() + 60 * 60_000), allDay: false, completed: false, travelRequired: false, calendarName: "Personal" };
}

test("calendar thresholds fire at 15, 10, 5 minutes, and now", () => {
  assert.equal(selectCalendarPreEventAlert([event()], new Date("2026-10-02T22:09:00Z"))?.timingLabel, "EVENT IN 15 MIN");
  assert.equal(selectCalendarPreEventAlert([event()], new Date("2026-10-02T22:14:00Z"))?.timingLabel, "EVENT IN 10 MIN");
  assert.equal(selectCalendarPreEventAlert([event()], new Date("2026-10-02T22:19:00Z"))?.timingLabel, "EVENT IN 5 MIN");
  assert.equal(selectCalendarPreEventAlert([event()], start)?.timingLabel, "EVENT STARTING NOW");
});

test("each calendar threshold is deduplicated and late polling does not replay old warnings", () => {
  const item = event();
  assert.equal(selectCalendarPreEventAlert([item], new Date("2026-10-02T22:09:30Z"), new Set(["event-1:15"])), null);
  assert.equal(selectCalendarPreEventAlert([item], new Date("2026-10-02T22:21:00Z"), new Set())?.timingLabel, undefined);
  assert.equal(selectCalendarPreEventAlert([item], start, new Set(["event-1:15", "event-1:10", "event-1:5"]))?.key, "event-1:now");
});
