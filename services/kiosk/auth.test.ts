import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dataRoute = readFileSync(resolve(process.cwd(), "app/api/kiosk/data/route.ts"), "utf8");
const diagnosticsRoute = readFileSync(resolve(process.cwd(), "app/api/kiosk/diagnostics/route.ts"), "utf8");

test("data and diagnostics use the same authenticated kiosk session validator", () => {
  assert.match(dataRoute, /getDeveloperKioskSession/);
  assert.match(diagnosticsRoute, /getDeveloperKioskSession/);
  assert.doesNotMatch(dataRoute, /getCurrentCosmicSession|kioskBootId/);
  assert.doesNotMatch(diagnosticsRoute, /getCurrentCosmicSession|kioskBootId/);
});

test("shared kiosk validator preserves device-only and boot-bound auth requirements", () => {
  const source = readFileSync(resolve(process.cwd(), "services/kiosk/auth.ts"), "utf8");
  assert.match(source, /allowUser: false/);
  assert.match(source, /allowDevice: true/);
  assert.match(source, /bootId: kioskBootId\(request\)/);
});
