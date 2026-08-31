import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { AIProviderError, createAIProviderError } from "./providerErrors.ts";

async function requestError(body: string, headers: Record<string, string> = {}) {
  const error = await createAIProviderError(new Response(body, { status: 429, headers }));
  assert.ok(error instanceof AIProviderError);
  return error;
}

test("preserves safe rate-limit error code", async () => {
  const error = await requestError(JSON.stringify({ error: { code: "rate_limit_exceeded" } }), { "Retry-After": "2", "x-request-id": "req_test_1" });
  assert.deepEqual(error.metadata, { status: 429, code: "rate_limit_exceeded", retryAfter: "2", requestId: "req_test_1" });
});

test("preserves safe quota error codes and types", async () => {
  assert.equal((await requestError(JSON.stringify({ error: { code: "credit_balance_exhausted" } }))).metadata?.code, "credit_balance_exhausted");
  assert.equal((await requestError(JSON.stringify({ error: { code: "project_spend_limit_exceeded" } }))).metadata?.code, "project_spend_limit_exceeded");
  assert.equal((await requestError(JSON.stringify({ error: { type: "insufficient_quota" } }))).metadata?.type, "insufficient_quota");
});

test("handles malformed error bodies without exposing the body", async () => {
  await requestError("provider secret and prompt must not escape");
});
