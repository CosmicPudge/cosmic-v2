import assert from "node:assert/strict";
import test from "node:test";

import type {
  CosmicCalendarEvent,
} from "../src/glasses/data/calendarClient.ts";
import {
  CALENDAR_CONTEXT_GRACE_MS,
  CALENDAR_CONTEXT_LEAD_MS,
  formatCalendarContext,
} from "../src/glasses/hud/calendarContext.ts";

const NOW = Date.parse("2026-09-07T12:00:00.000Z");

function event(minutesFromNow: number, overrides: Partial<CosmicCalendarEvent> = {}): CosmicCalendarEvent {
  const start = new Date(NOW + minutesFromNow * 60_000).toISOString();
  return {
    title: "ENGR 1010",
    start,
    end: new Date(NOW + (minutesFromNow + 50) * 60_000).toISOString(),
    location: null,
    calendarName: "Classes",
    minutesUntil: minutesFromNow,
    ...overrides,
  };
}

test("shows only events within the 15-minute lead window", () => {
  assert.equal(formatCalendarContext(event(16), NOW), "");
  assert.equal(formatCalendarContext(event(15), NOW), "ENGR 1010 • 15 MIN");
  assert.equal(formatCalendarContext(event(8), NOW), "ENGR 1010 • 8 MIN");
  assert.equal(formatCalendarContext(event(1), NOW), "ENGR 1010 • 1 MIN");
});

test("uses Date.now-derived ceil countdown and NOW during the grace period", () => {
  assert.equal(
    formatCalendarContext(event(8), NOW + 20_000),
    "ENGR 1010 • 8 MIN",
  );
  assert.equal(
    formatCalendarContext(event(0), NOW),
    "ENGR 1010 • NOW",
  );
  assert.equal(
    formatCalendarContext(
      event(-4),
      NOW,
    ),
    "ENGR 1010 • NOW",
  );
  assert.equal(
    formatCalendarContext(
      event(-5),
      NOW + 5 * 60_000 + 1,
    ),
    "",
  );
});

test("shows useful locations and omits conferencing or oversized locations", () => {
  assert.equal(
    formatCalendarContext(event(8, { location: "ENGR BLDG 105" }), NOW),
    "ENGR 1010 • 8 MIN\nENGR BLDG 105",
  );
  assert.equal(
    formatCalendarContext(event(8, { location: "https://zoom.us/j/123" }), NOW),
    "ENGR 1010 • 8 MIN",
  );
  assert.equal(
    formatCalendarContext(event(8, { location: "A very long location that cannot fit" }), NOW),
    "ENGR 1010 • 8 MIN",
  );
});

test("omits invalid, all-day, cancelled, and stale events", () => {
  assert.equal(formatCalendarContext(event(8, { title: "" }), NOW), "");
  assert.equal(formatCalendarContext(event(8, { start: "invalid" }), NOW), "");
  assert.equal(formatCalendarContext(event(8, { allDay: true }), NOW), "");
  assert.equal(formatCalendarContext(event(8, { cancelled: true }), NOW), "");
  assert.equal(formatCalendarContext(event(16), NOW), "");
});

test("uses the documented lead and grace constants", () => {
  assert.equal(CALENDAR_CONTEXT_LEAD_MS, 15 * 60_000);
  assert.equal(CALENDAR_CONTEXT_GRACE_MS, 5 * 60_000);
});
