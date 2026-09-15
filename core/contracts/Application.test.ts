import test from "node:test";
import assert from "node:assert/strict";
import { PERSONAL_COSMIC_APPLICATION } from "./Application";

test("personal application context is stable and accountless", () => {
  assert.deepEqual(PERSONAL_COSMIC_APPLICATION, {
    mode: "personal",
    scope: { kind: "personal", id: "personal" },
    principal: "personal",
    commercial: false,
  });
  assert.equal("userId" in PERSONAL_COSMIC_APPLICATION, false);
  assert.equal("account" in PERSONAL_COSMIC_APPLICATION, false);
  assert.equal("session" in PERSONAL_COSMIC_APPLICATION, false);
});
