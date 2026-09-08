import test from "node:test";
import assert from "node:assert/strict";
import { classifyMetricError, getObservabilitySnapshot, recordAIMetric, recordCacheMetric, recordDatabaseMetric, recordProviderMetric, resetObservabilityForTests } from "./metrics";

test.beforeEach(() => resetObservabilityForTests());

test("aggregates database, provider, cache, and AI counters without payload data", () => {
  recordDatabaseMetric({ operation: "select", durationMs: 12.4, rows: 3 });
  recordDatabaseMetric({ operation: "select", durationMs: 4, errorCategory: "timeout" });
  recordProviderMetric({ provider: "sports", operation: "fetchJson", durationMs: 8, responseBytes: 120 });
  recordCacheMetric({ cache: "sports.snapshot", event: "hits" });
  recordCacheMetric({ cache: "sports.snapshot", event: "coalesced" });
  recordAIMetric({ provider: "openai", model: "safe-model", feature: "generate", durationMs: 20, inputTokens: 10, outputTokens: 4, cachedTokens: 2 });

  const snapshot = getObservabilitySnapshot();
  assert.equal(snapshot.database.select.requests, 2);
  assert.equal(snapshot.database.select.failures, 1);
  assert.equal(snapshot.database.select.totalRows, 3);
  assert.equal(snapshot.providers["sports:fetchJson"].responseBytes, 120);
  assert.deepEqual(snapshot.caches["sports.snapshot"], { hits: 1, misses: 0, coalesced: 1, refreshes: 0, evictions: 0, stale: 0, failures: 0 });
  assert.equal(snapshot.ai["openai:safe-model:generate"].inputTokens, 10);
  assert.equal(snapshot.ai["openai:safe-model:generate"].usageKnownRequests, 1);
  assert.equal(JSON.stringify(snapshot).includes("secret"), false);
  assert.equal(JSON.stringify(snapshot).includes("user@example.com"), false);
});

test("bounds metric key retention", () => {
  for (let index = 0; index < 140; index += 1) recordProviderMetric({ provider: `provider-${index}`, operation: "request" });
  const snapshot = getObservabilitySnapshot();
  assert.equal(Object.keys(snapshot.providers).length, 128);
  assert.equal(snapshot.providers["provider-0:request"], undefined);
  assert.ok(snapshot.providers["provider-139:request"]);
});

test("categorizes safe operational errors", () => {
  assert.equal(classifyMetricError(new Error("request timed out")), "timeout");
  assert.equal(classifyMetricError(new Error("HTTP 429")), "rate_limit");
  assert.equal(classifyMetricError(new Error("getaddrinfo ENOTFOUND")), "connection");
  assert.equal(classifyMetricError(new Error("private token should not be logged")), "unknown");
});
