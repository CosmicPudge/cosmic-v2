import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { transcribeWithSchoolRouter } from "./transcriptionRouter.ts";

const input = { bytes: new Uint8Array([73, 68, 51, 0]), mimeType: "audio/mpeg" as const, fileName: "note.mp3" };
const env = process.env as Record<string, string | undefined>;

function configure() { env.OPENAI_API_KEY = "test-openai"; env.CLOUDFLARE_ACCOUNT_ID = "test-account"; env.CLOUDFLARE_AI_API_TOKEN = "test-cloudflare"; env.SCHOOL_TRANSCRIPTION_PROVIDER = "openai"; }
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }

test("OpenAI transcription success is normalized", async () => {
  configure(); const previous = globalThis.fetch; globalThis.fetch = async () => response({ text: "hello", language: "en", duration: 3, segments: [{ start: 0, end: 1, text: "hello" }] });
  try { const routed = await transcribeWithSchoolRouter(input); assert.equal(routed.result.text, "hello"); assert.equal(routed.result.provider, "openai"); assert.equal(routed.attempts.length, 1); assert.equal(routed.attempts[0]?.outcome, "success"); } finally { globalThis.fetch = previous; }
});

test("Cloudflare transcription success uses Whisper and normalizes the result", async () => {
  configure(); env.SCHOOL_TRANSCRIPTION_PROVIDER = "cloudflare"; const previous = globalThis.fetch; let request: RequestInit | undefined; globalThis.fetch = async (_url, init) => { request = init; return response({ result: { text: "from cloudflare", segments: [{ start: 0, end: 2, text: "from cloudflare" }] } }); };
  try { const routed = await transcribeWithSchoolRouter(input); assert.equal(routed.result.text, "from cloudflare"); assert.equal(routed.result.provider, "cloudflare"); assert.equal(JSON.parse(String(request?.body)).task, "transcribe"); } finally { globalThis.fetch = previous; }
});

test("OpenAI quota falls back to Cloudflare once", async () => {
  configure(); env.SCHOOL_TRANSCRIPTION_PROVIDER = "openai"; const previous = globalThis.fetch; const calls: string[] = []; globalThis.fetch = async (url) => { calls.push(String(url)); return calls.length === 1 ? response({ error: "quota" }, 429) : response({ result: { text: "fallback" } }); };
  try { const routed = await transcribeWithSchoolRouter(input); assert.equal(routed.result.text, "fallback"); assert.deepEqual(routed.attempts.map((item) => item.outcome), ["failure", "success"]); assert.equal(calls.length, 2); } finally { globalThis.fetch = previous; }
});

test("Cloudflare temporary failure falls back to OpenAI", async () => {
  configure(); env.SCHOOL_TRANSCRIPTION_PROVIDER = "cloudflare"; const previous = globalThis.fetch; const calls: string[] = []; globalThis.fetch = async (url) => { calls.push(String(url)); return calls.length === 1 ? response({ error: "temporary" }, 503) : response({ text: "openai fallback" }); };
  try { const routed = await transcribeWithSchoolRouter(input); assert.equal(routed.result.provider, "openai"); assert.deepEqual(routed.attempts.map((item) => item.code), ["transcription_provider_unavailable", undefined]); } finally { globalThis.fetch = previous; }
});

test("both providers fail with safe attempt history", async () => {
  configure(); env.SCHOOL_TRANSCRIPTION_PROVIDER = "auto"; const previous = globalThis.fetch; globalThis.fetch = async () => response({ error: "temporary" }, 503);
  try { await assert.rejects(() => transcribeWithSchoolRouter(input), (error: unknown) => { const value = error as { code?: string; attempts?: Array<{ outcome: string }> }; return value.code === "transcription_provider_unavailable" && value.attempts?.map((item) => item.outcome).join(",") === "failure,failure"; }); } finally { globalThis.fetch = previous; }
});

test("a provider that cannot accept the recording is skipped", async () => {
  configure(); env.SCHOOL_TRANSCRIPTION_PROVIDER = "openai"; const previous = globalThis.fetch; globalThis.fetch = async () => response({ result: { text: "cloudflare handles it" } }); const largeInput = { ...input, bytes: new Uint8Array(26 * 1024 * 1024) };
  try { const routed = await transcribeWithSchoolRouter(largeInput); assert.equal(routed.result.provider, "cloudflare"); assert.equal(routed.attempts[0]?.outcome, "skipped"); assert.equal(routed.attempts[0]?.code, "transcription_too_large"); } finally { globalThis.fetch = previous; }
});

test("provider format failure does not masquerade as generic validation", async () => {
  configure(); env.SCHOOL_TRANSCRIPTION_PROVIDER = "openai"; const previous = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls += 1; return response({ error: "invalid" }, 400); };
  try { await assert.rejects(() => transcribeWithSchoolRouter(input), (error: unknown) => (error as { code?: string }).code === "transcription_provider_format"); assert.equal(calls, 1); } finally { globalThis.fetch = previous; }
});

test("unconfigured preferred provider is skipped", async () => {
  delete env.OPENAI_API_KEY; env.CLOUDFLARE_ACCOUNT_ID = "test-account"; env.CLOUDFLARE_AI_API_TOKEN = "test-cloudflare"; env.SCHOOL_TRANSCRIPTION_PROVIDER = "openai"; const previous = globalThis.fetch; globalThis.fetch = async () => response({ result: { text: "cloudflare only" } });
  try { const routed = await transcribeWithSchoolRouter(input); assert.equal(routed.result.provider, "cloudflare"); assert.equal(routed.attempts[0]?.outcome, "skipped"); } finally { globalThis.fetch = previous; }
});
