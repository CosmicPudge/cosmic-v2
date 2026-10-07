import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/kiosk/developerKiosk.ts"), "utf8");

test("kiosk Calendar provider work is bounded before the aggregate can hang", () => {
  assert.match(source, /withKioskDataProviderTimeout\(getDeveloperKioskCalendarEngine\(accountId\)\)/);
  assert.match(source, /withKioskDataProviderTimeout\(engine\.getEvents\(\{ start: now, end \}\)\)/);
  assert.match(source, /KIOSK_DATA_PROVIDER_TIMEOUT_MS = 10_000/);
});

test("a slow School provider cannot hold the Calendar aggregate loading forever", () => {
  assert.match(source, /withKioskDataProviderTimeout\(getDeveloperKioskSchoolData\(accountId\)\)/);
});

test("Calendar instrumentation contains only safe lifecycle categories", () => {
  assert.match(source, /\[kiosk-calendar\]/);
  const logLines = source.split("\n").filter((line) => line.includes("[kiosk-calendar]"));
  assert.ok(logLines.length > 0);
  assert.doesNotMatch(logLines.join("\n"), /url|accountId|token|cookie|credential/i);
});
