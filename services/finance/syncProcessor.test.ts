import assert from "node:assert/strict";
import { test } from "node:test";
import { isRetryableFinanceError, retryDelayMs } from "./syncProcessor";

test("sync processor retries transient errors but not reconnect/configuration errors", () => {
  assert.equal(isRetryableFinanceError("provider_unavailable"), true);
  assert.equal(isRetryableFinanceError("rate_limited"), true);
  assert.equal(isRetryableFinanceError("reconnect_required"), false);
  assert.equal(isRetryableFinanceError("provider_configuration"), false);
  assert.ok(retryDelayMs(1) >= 30_000);
  assert.ok(retryDelayMs(20) <= 18 * 60_000);
});
