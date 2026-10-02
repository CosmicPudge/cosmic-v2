import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./KioskSchoolScene.tsx", import.meta.url), "utf8");

test("connected School always renders the structured content layer", () => {
  assert.match(source, /className="kiosk-time-scene"/);
  assert.match(source, /school\.connected/);
  assert.match(source, /You&apos;re caught up\./);
  assert.match(source, /Nothing due today/);
  assert.match(source, /No more work this week/);
});

test("School uses the shared time-scene stacking wrapper", () => {
  assert.doesNotMatch(source, /className="kiosk-time-scene-main"/);
});
