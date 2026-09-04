import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { generateWithBoundedResilience } from "./resilientProvider.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { AIProviderError } from "./providerErrors.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { getConfiguredAIProviders, registerOpenAIProvider } from "./providers/providerRouter.ts";

const input = { context: "test", messages: [{ role: "user" as const, content: "safe test input" }] };
function provider(id: string, generate: () => Promise<string>) { return { id, model: `${id}-model`, generate, stream: async () => new Response() }; }
function transient() { return new AIProviderError("provider_request_failed", 502, { status: 502 }); }
const originalEnv = { aiProvider: process.env.AI_PROVIDER, openAiKey: process.env.OPENAI_API_KEY, cloudflareAccount: process.env.CLOUDFLARE_ACCOUNT_ID, cloudflareToken: process.env.CLOUDFLARE_AI_API_TOKEN };
const fakeOpenAI = provider("openai", async () => "configured fallback");
registerOpenAIProvider(() => fakeOpenAI);
test.afterEach(() => { for (const [key, value] of [["AI_PROVIDER", originalEnv.aiProvider], ["OPENAI_API_KEY", originalEnv.openAiKey], ["CLOUDFLARE_ACCOUNT_ID", originalEnv.cloudflareAccount], ["CLOUDFLARE_AI_API_TOKEN", originalEnv.cloudflareToken]] as const) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });

test("retries a transient chunk failure without rerunning successful work", async () => {
  let primaryCalls = 0;
  const primary = provider("cloudflare-workers-ai", async () => { primaryCalls += 1; if (primaryCalls === 1) throw transient(); return "chunk result"; });
  const fallback = provider("openai", async () => "fallback result");
  const result = await generateWithBoundedResilience(input, { operation: "school_transcript_chunk", chunkIndex: 1, chunkCount: 2 }, [primary, fallback]);
  assert.equal(result.provider.id, "cloudflare-workers-ai");
  assert.equal(primaryCalls, 2);
});

test("uses one fallback attempt after both primary attempts fail", async () => {
  let primaryCalls = 0;
  let fallbackCalls = 0;
  const primary = provider("cloudflare-workers-ai", async () => { primaryCalls += 1; throw transient(); });
  const fallback = provider("openai", async () => { fallbackCalls += 1; return "fallback result"; });
  const result = await generateWithBoundedResilience(input, { operation: "school_transcript_chunk" }, [primary, fallback]);
  assert.equal(result.provider.id, "openai");
  assert.equal(primaryCalls, 2);
  assert.equal(fallbackCalls, 1);
});

test("applies the same bounded policy to final merge requests", async () => {
  let calls = 0;
  const primary = provider("cloudflare-workers-ai", async () => { calls += 1; if (calls === 1) throw transient(); return "final result"; });
  const result = await generateWithBoundedResilience(input, { operation: "school_transcript_final_merge" }, [primary]);
  assert.equal(result.value, "final result");
  assert.equal(calls, 2);
});

test("does not retry parser or other non-transient failures", async () => {
  let calls = 0;
  const primary = provider("cloudflare-workers-ai", async () => { calls += 1; throw new AIProviderError("provider_request_failed", 400, { status: 400 }); });
  await assert.rejects(() => generateWithBoundedResilience(input, { operation: "school_transcript_chunk" }, [primary]));
  assert.equal(calls, 1);
});

test("fails after all configured providers are exhausted", async () => {
  const primary = provider("cloudflare-workers-ai", async () => { throw transient(); });
  const fallback = provider("openai", async () => { throw transient(); });
  await assert.rejects(() => generateWithBoundedResilience(input, { operation: "school_transcript_final_merge" }, [primary, fallback]), AIProviderError);
});

test("does not call an unavailable fallback", async () => {
  const primary = provider("cloudflare-workers-ai", async () => { throw transient(); });
  await assert.rejects(() => generateWithBoundedResilience(input, { operation: "school_transcript_chunk" }, [primary]));
});

test("detects configured and missing OpenAI fallback credentials", () => {
  process.env.AI_PROVIDER = "cloudflare";
  process.env.CLOUDFLARE_ACCOUNT_ID = "account-test";
  process.env.CLOUDFLARE_AI_API_TOKEN = "token-test";
  process.env.OPENAI_API_KEY = "key-test";
  assert.deepEqual(getConfiguredAIProviders().map((item) => item.id), ["cloudflare-workers-ai", "openai"]);
  delete process.env.OPENAI_API_KEY;
  assert.deepEqual(getConfiguredAIProviders().map((item) => item.id), ["cloudflare-workers-ai"]);
});

test("School preference invokes OpenAI before configured Cloudflare", async () => {
  let openAiCalls = 0;
  registerOpenAIProvider(() => provider("openai", async () => { openAiCalls += 1; return "openai result"; }));
  process.env.OPENAI_API_KEY = "key-test";
  process.env.CLOUDFLARE_ACCOUNT_ID = "account-test";
  process.env.CLOUDFLARE_AI_API_TOKEN = "token-test";
  const result = await generateWithBoundedResilience(input, { operation: "school_transcript_chunk", providerPreference: ["openai", "cloudflare-workers-ai"] });
  assert.equal(result.provider.id, "openai");
  assert.equal(openAiCalls, 1);
});
