import assert from "node:assert/strict";
import test from "node:test";

import { safePushRoute } from "./routes.js";
import { parsePushSubscription, safeDeviceLabel } from "./validation.js";

test("push routes allow only internal Sports destinations", () => {
  assert.equal(safePushRoute("/sports"), "/sports");
  assert.equal(safePushRoute("/sports/event/abc"), "/sports/event/abc");
  for (const value of ["https://evil.example", "//evil.example", "javascript:alert(1)", "data:text/html,x", "/sports\\\\event/abc", "/%2F%2Fevil.example", "/account"]) assert.equal(safePushRoute(value), "/sports");
});

test("push subscription validation rejects malformed or non-HTTPS endpoints", () => {
  assert.equal(parsePushSubscription(null), null);
  assert.equal(parsePushSubscription({ endpoint: "http://push.example", keys: { p256dh: "key", auth: "auth" } }), null);
  assert.deepEqual(parsePushSubscription({ endpoint: "https://push.example/sub", keys: { p256dh: "key", auth: "auth" } }), { endpoint: "https://push.example/sub", keys: { p256dh: "key", auth: "auth" } });
  assert.equal(safeDeviceLabel("\u0000 MacBook "), "MacBook");
});
