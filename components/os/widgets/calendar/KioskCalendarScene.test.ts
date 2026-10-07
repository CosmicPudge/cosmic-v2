import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./KioskCalendarScene.tsx", import.meta.url), "utf8");
const widgetSource = readFileSync(new URL("./CalendarWidget.tsx", import.meta.url), "utf8");

test("Calendar header uses today while Up Next formats its own date", () => {
  assert.match(source, /CALENDAR · TODAY/);
  assert.match(source, /formatDate\(now/);
  assert.match(source, /formatEventTime\(nextEvent, timeZone, true\)/);
  assert.match(source, /excludeId=\{nextEvent\?\.id\}/);
});

test("Calendar kiosk rows use compact locations", () => {
  assert.match(source, /compactKioskLocation\(event\.location\)/);
  assert.match(source, /compactKioskLocation\(nextEvent\.location\)/);
});

test("Calendar kiosk uses aggregate loading and error state when direct Calendar is disabled", () => {
  assert.match(widgetSource, /presentation === "kiosk"\) \{\s+return <KioskCalendarScene calendar=\{visibleCalendar\} loading=\{developer\.loading\} error=\{developer\.error\}/);
  assert.doesNotMatch(widgetSource, /developer\.data \? developer\.loading : loading/);
  assert.doesNotMatch(widgetSource, /developer\.data \? developer\.error : error/);
});
