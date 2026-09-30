import assert from "node:assert/strict";
import test from "node:test";
import type { SchoolAIProviderResult, SchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { interpretSchoolAssignment } from "./service";
import { GeminiSchoolAIProvider } from "./geminiProvider";

const env = process.env as Record<string, string | undefined>;
env.NODE_ENV = "test";
const originalFetch = globalThis.fetch;
const originalKey = env.GEMINI_API_KEY;
const originalModel = env.GEMINI_MODEL;
const originalProvider = env.SCHOOL_AI_PROVIDER;

const candidate = {
  summary: "Review the supplied material and submit the worksheet.",
  requirements: [{ text: "Review Chapters 4–6.", kind: "material" }],
  deliverables: [{ text: "Complete the attached worksheet.", format: "worksheet" }],
  estimatedMinutes: 75,
  effortCategory: "moderate",
  suggestedSteps: [{ text: "Review Chapters 4–6.", order: 0, estimatedMinutes: 45 }, { text: "Complete the worksheet.", order: 1, estimatedMinutes: 30 }],
  studyTopics: ["Chapters 4–6"],
  ambiguities: [],
  warnings: [],
  confidence: 0.85,
};

const assignment = (): SchoolPlanningAssignment => ({ id: "canvas-api:121:8", accountId: "account-1", title: "CHEM 1210 — Exam Review", description: "Review Chapters 4–6. Complete the attached worksheet.", courseId: "121", courseName: "CHEM 1210", dueAt: new Date("2026-10-08T23:59:00.000Z"), sourceType: "canvas-api", completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: new Date("2026-09-01T00:00:00.000Z"), updatedAt: new Date("2026-09-01T00:00:00.000Z") });

function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }
function restore(name: string, value: string | undefined) { if (value === undefined) delete env[name]; else env[name] = value; }
test.afterEach(() => { globalThis.fetch = originalFetch; restore("GEMINI_API_KEY", originalKey); restore("GEMINI_MODEL", originalModel); restore("SCHOOL_AI_PROVIDER", originalProvider); });

test("Gemini success requests bounded JSON and returns safe provider metadata", async () => {
  env.GEMINI_API_KEY = "synthetic-secret";
  env.GEMINI_MODEL = "gemini-2.5-flash-test";
  let requestUrl = "";
  let requestBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (url, init) => { requestUrl = String(url); requestBody = JSON.parse(String(init?.body)); return response({ candidates: [{ content: { parts: [{ text: JSON.stringify(candidate) }] } }], usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 80 } }); };
  const result = await new GeminiSchoolAIProvider().interpretAssignment({ title: "CHEM 1210 — Exam Review", description: "Review Chapters 4–6." });
  assert.equal(result.providerId, "gemini");
  assert.equal(result.modelId, "gemini-2.5-flash-test");
  assert.equal(result.usage?.inputTokens, 120);
  assert.match(requestUrl, /gemini-2\.5-flash-test/);
  assert.equal((requestBody?.generationConfig as Record<string, unknown>).responseMimeType, "application/json");
  assert.equal((requestBody?.generationConfig as Record<string, unknown>).temperature, 0.1);
  assert.equal(JSON.stringify(requestBody).includes("Canvas token"), false);
  assert.equal(JSON.stringify(requestBody).includes("synthetic-secret"), false);
});

test("Gemini is routed through Phase D normalization", async () => {
  env.GEMINI_API_KEY = "synthetic-secret";
  env.SCHOOL_AI_PROVIDER = "gemini";
  globalThis.fetch = async () => response({ candidates: [{ content: { parts: [{ text: JSON.stringify(candidate) }] } }] });
  const result = await interpretSchoolAssignment(assignment(), { enabledForTests: true });
  assert.equal(result.ok, true);
  if (result.ok) { assert.equal(result.value.source, "ai"); assert.equal(result.value.requirements[0]?.text, "Review Chapters 4–6."); assert.equal(result.value.estimatedMinutes, 75); }
});

test("missing Gemini key is typed as not configured", async () => {
  delete env.GEMINI_API_KEY;
  await assert.rejects(() => new GeminiSchoolAIProvider().interpretAssignment({ title: "Synthetic assignment" }), (error: unknown) => (error as { code?: string }).code === "NOT_CONFIGURED");
});

test("Gemini HTTP failures map to safe typed categories without retries", async () => {
  env.GEMINI_API_KEY = "synthetic-secret";
  for (const [status, body, code] of [[401, { error: { message: "bad key" } }, "AUTHENTICATION"], [429, { error: { message: "quota exhausted" } }, "QUOTA"], [429, { error: { message: "slow down" } }, "RATE_LIMIT"], [503, { error: { message: "service unavailable" } }, "PROVIDER_UNAVAILABLE"]] as const) {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; return response(body, status); };
    await assert.rejects(() => new GeminiSchoolAIProvider().interpretAssignment({ title: "Synthetic assignment" }), (error: unknown) => (error as { code?: string; retryable?: boolean }).code === code);
    assert.equal(calls, 1);
  }
});

test("Gemini timeout and network failures are mapped without leaking provider text", async () => {
  env.GEMINI_API_KEY = "synthetic-secret";
  globalThis.fetch = async () => { throw new DOMException("provider secret detail", "TimeoutError"); };
  await assert.rejects(() => new GeminiSchoolAIProvider().interpretAssignment({ title: "Synthetic assignment" }), (error: unknown) => { const value = error as { code?: string; message?: string }; return value.code === "TIMEOUT" && !value.message?.includes("provider secret"); });
  globalThis.fetch = async () => { throw new TypeError("secret network detail"); };
  await assert.rejects(() => new GeminiSchoolAIProvider().interpretAssignment({ title: "Synthetic assignment" }), (error: unknown) => (error as { code?: string }).code === "NETWORK");
});

test("Gemini safety refusal and malformed structured output fail closed", async () => {
  env.GEMINI_API_KEY = "synthetic-secret";
  globalThis.fetch = async () => response({ promptFeedback: { blockReason: "SAFETY" } });
  await assert.rejects(() => new GeminiSchoolAIProvider().interpretAssignment({ title: "Synthetic assignment" }), (error: unknown) => (error as { code?: string }).code === "SAFETY_REFUSAL");
  globalThis.fetch = async () => response({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] });
  await assert.rejects(() => new GeminiSchoolAIProvider().interpretAssignment({ title: "Synthetic assignment" }), (error: unknown) => (error as { code?: string }).code === "MALFORMED_RESPONSE");
});

test("invalid normalized fields remain rejected after Gemini transport succeeds", async () => {
  env.GEMINI_API_KEY = "synthetic-secret";
  const invalid = { ...candidate, confidence: 3, estimatedMinutes: -5 };
  globalThis.fetch = async () => response({ candidates: [{ content: { parts: [{ text: JSON.stringify(invalid) }] } }] });
  const result = await interpretSchoolAssignment(assignment(), { enabledForTests: true, provider: new GeminiSchoolAIProvider() });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "MALFORMED_RESPONSE");
});

test("provider interface remains assignment-input-only", async () => {
  const provider = { id: "test", async interpretAssignment(received: SchoolAssignmentInterpretationInput): Promise<SchoolAIProviderResult> { assert.equal(received.title, "CHEM 1210 — Exam Review"); assert.equal("token" in received, false); return { candidate, providerId: "test", responseStatus: "ok", warnings: [] }; } };
  const result = await interpretSchoolAssignment(assignment(), { enabledForTests: true, provider });
  assert.equal(result.ok, true);
});
