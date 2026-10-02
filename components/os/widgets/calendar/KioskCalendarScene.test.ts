import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./KioskCalendarScene.tsx", import.meta.url), "utf8");

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
