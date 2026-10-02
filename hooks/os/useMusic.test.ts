import assert from "node:assert/strict";
import test from "node:test";
import { isMusicConfigured } from "./useMusic";

test("music configuration state comes from the explicit configured field", () => {
  assert.equal(isMusicConfigured({ configured: true, provider: "spotify" } as never), true);
  assert.equal(isMusicConfigured({ configured: true } as never), true);
  assert.equal(isMusicConfigured({ configured: false, provider: "spotify" } as never), false);
  assert.equal(isMusicConfigured(null), false);
});
