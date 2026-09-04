import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { getCloudflareAIProvider } from "./cloudflare.ts";

const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; delete process.env.CLOUDFLARE_ACCOUNT_ID; delete process.env.CLOUDFLARE_AI_API_TOKEN; delete process.env.CLOUDFLARE_AI_MODEL; });

test("Cloudflare provider parses a successful response without exposing credentials", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "account-test"; process.env.CLOUDFLARE_AI_API_TOKEN = "secret-test";
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => { request = new Request(input, init); return new Response(JSON.stringify({ success: true, result: { response: "Use the due-soon task first." } }), { status: 200 }); };
  const value = await getCloudflareAIProvider().generate({ context: "Facts only", maxOutputTokens: 2400, responseFormat: { name: "ignored-by-cloudflare-adapter", schema: {} }, messages: [{ role: "user", content: "Explain." }] });
  assert.equal(value, "Use the due-soon task first."); assert.equal(request?.headers.get("Authorization"), "Bearer secret-test"); assert.equal(request?.url, "https://api.cloudflare.com/client/v4/accounts/account-test/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8"); const body = await request?.json() as Record<string, unknown> & { messages: Array<{ role: string; content: string }>; max_tokens: number; temperature: number }; assert.deepEqual(body.messages.map((item) => item.role), ["system", "user"]); assert.match(body.messages[0].content, /Facts only/); assert.equal(body.messages[1].content, "Explain."); assert.equal(body.max_tokens, 2400); assert.equal(body.temperature, 0.1); assert.equal("response_format" in body, false); assert.equal("text" in body, false); assert.equal("max_output_tokens" in body, false);
});

test("Cloudflare provider preserves a custom configured model", () => {
  process.env.CLOUDFLARE_AI_MODEL = "@cf/meta/custom-model";
  assert.equal(getCloudflareAIProvider().model, "@cf/meta/custom-model");
});

test("Cloudflare provider uses the current fallback when model env is absent", () => {
  assert.equal(getCloudflareAIProvider().model, "@cf/meta/llama-3.1-8b-instruct-fp8");
});

test("Cloudflare provider preserves safe errors[] metadata", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "account-test"; process.env.CLOUDFLARE_AI_API_TOKEN = "secret-test";
  globalThis.fetch = async () => new Response(JSON.stringify({ errors: [{ code: 5004, message: "Request data is invalid." }] }), { status: 400, headers: { "cf-ray": "safe-ray-id" } });
  await assert.rejects(() => getCloudflareAIProvider().generate({ context: "Facts only", messages: [{ role: "user", content: "Transcript data" }] }), (error: unknown) => error instanceof Error && "status" in error && (error as { status?: number }).status === 400 && "metadata" in error && (error as { metadata?: { code?: string; message?: string; requestId?: string } }).metadata?.code === "5004" && (error as { metadata?: { message?: string } }).metadata?.message === "Request data is invalid." && (error as { metadata?: { requestId?: string } }).metadata?.requestId === "safe-ray-id");
});
