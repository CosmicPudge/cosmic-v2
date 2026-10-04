import assert from "node:assert/strict";
import test from "node:test";
import { activeKioskResources, startKioskResource } from "./resourceLifecycle";

test("resource lifecycle returns to zero after repeated mount and unmount", () => {
  const first = startKioskResource("music");
  const second = startKioskResource("music");
  assert.equal(activeKioskResources().music, 2);
  first();
  second();
  assert.equal(activeKioskResources().music, undefined);
});

test("resource cleanup is idempotent", () => {
  const stop = startKioskResource("kiosk-control");
  stop();
  stop();
  assert.equal(activeKioskResources()["kiosk-control"], undefined);
});
