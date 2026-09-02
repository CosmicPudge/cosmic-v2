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
  const value = await getCloudflareAIProvider().generate({ context: "Facts only", messages: [{ role: "user", content: "Explain." }] });
  assert.equal(value, "Use the due-soon task first."); assert.equal(request?.headers.get("Authorization"), "Bearer secret-test"); const body = await request?.json() as { messages: Array<{ role: string; content: string }>; max_tokens: number; temperature: number }; assert.deepEqual(body.messages.map((item) => item.role), ["system", "user"]); assert.match(body.messages[0].content, /Facts only/); assert.equal(body.messages[1].content, "Explain."); assert.equal(body.max_tokens, 600); assert.equal(body.temperature, 0.1);
});

test("Cloudflare provider classifies quota errors safely", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "account-test"; process.env.CLOUDFLARE_AI_API_TOKEN = "secret-test";
  globalThis.fetch = async () => new Response(JSON.stringify({ errors: [{ code: 10013 }] }), { status: 429 });
  await assert.rejects(() => getCloudflareAIProvider().generate({ context: "Facts only", messages: [] }), (error: unknown) => error instanceof Error && "status" in error && (error as { status?: number }).status === 429);
});
