import "server-only";
import type { SchoolAIProviderResult, SchoolAIRequestOptions, SchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";
import { SchoolAIError } from "./errors";
import type { SchoolAIProvider } from "./provider";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 1_200;

export const SCHOOL_ASSIGNMENT_INTERPRETATION_PROMPT = [
  "Interpret only the supplied academic assignment data.",
  "Extract explicit requirements, concrete deliverables, formatting/length/submission/grading requirements, required materials, conservative workload estimates, logical work steps, study topics, ambiguities, and important warnings.",
  "Stay grounded in the supplied data. Do not invent requirements, rubric details, due dates, course rules, or external context.",
  "Source facts such as title, dates, points, and submission metadata are authoritative and must not be rewritten in the interpretation.",
  "If information is missing or unclear, record an ambiguity and lower confidence rather than guessing.",
  "Return only the requested JSON object. Do not return markdown, prose outside the object, hidden reasoning, or chain-of-thought.",
].join(" ");

const responseSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    requirements: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" }, kind: { type: "STRING", enum: ["task", "format", "length", "submission", "grading", "material", "other"] }, completed: { type: "BOOLEAN" }, evidence: { type: "STRING" } }, required: ["text", "kind"] } },
    deliverables: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" }, format: { type: "STRING" }, evidence: { type: "STRING" } }, required: ["text"] } },
    estimatedMinutes: { type: "INTEGER" },
    effortCategory: { type: "STRING", enum: ["quick", "moderate", "heavy", "major"] },
    suggestedSteps: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" }, order: { type: "INTEGER" }, estimatedMinutes: { type: "INTEGER" } }, required: ["text", "order"] } },
    studyTopics: { type: "ARRAY", items: { type: "STRING" } },
    ambiguities: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" }, severity: { type: "STRING", enum: ["low", "medium", "high"] }, category: { type: "STRING" } }, required: ["text", "severity"] } },
    warnings: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, text: { type: "STRING" }, severity: { type: "STRING", enum: ["low", "medium", "high"] }, category: { type: "STRING" } }, required: ["text", "severity"] } },
    confidence: { type: "NUMBER" },
  },
  required: ["requirements", "deliverables", "suggestedSteps", "studyTopics", "ambiguities", "warnings"],
} as const;

type GeminiResponse = {
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: unknown }> } }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

function modelName() { return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL; }
function apiKey() { return process.env.GEMINI_API_KEY?.trim(); }
function endpoint(model: string, key: string) { return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`; }

function requestBody(input: SchoolAssignmentInterpretationInput) {
  return {
    system_instruction: { parts: [{ text: SCHOOL_ASSIGNMENT_INTERPRETATION_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema, temperature: 0.1, maxOutputTokens: MAX_OUTPUT_TOKENS },
  };
}

function safeProviderError(status: number, body: unknown, providerId: string, modelId: string) {
  const text = body && typeof body === "object" ? JSON.stringify(body).toLowerCase() : "";
  if (status === 401 || status === 403) return new SchoolAIError("AUTHENTICATION", "Gemini authentication failed.", { providerId, modelId, diagnostic: { status } });
  if (status === 429) return new SchoolAIError(/quota|resource exhausted|exhausted/i.test(text) ? "QUOTA" : "RATE_LIMIT", "Gemini is temporarily rate limited.", { retryable: true, providerId, modelId, diagnostic: { status } });
  if (status >= 500) return new SchoolAIError("PROVIDER_UNAVAILABLE", "Gemini is temporarily unavailable.", { retryable: true, providerId, modelId, diagnostic: { status } });
  return new SchoolAIError("UNKNOWN", "Gemini rejected the interpretation request.", { providerId, modelId, diagnostic: { status } });
}

function blocked(reason: string | undefined, providerId: string, modelId: string) {
  return reason ? new SchoolAIError("SAFETY_REFUSAL", "Gemini declined this interpretation.", { providerId, modelId }) : undefined;
}

export class GeminiSchoolAIProvider implements SchoolAIProvider {
  readonly id = "gemini";
  readonly model = modelName();

  async interpretAssignment(input: SchoolAssignmentInterpretationInput, options: SchoolAIRequestOptions = {}): Promise<SchoolAIProviderResult> {
    const key = apiKey();
    if (!key) throw new SchoolAIError("NOT_CONFIGURED", "Gemini is not configured.", { providerId: this.id, modelId: this.model });
    const startedAt = Date.now();
    let response: Response;
    try {
      const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
      response = await fetch(endpoint(this.model, key), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody(input)), signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") throw new SchoolAIError("TIMEOUT", "Gemini interpretation timed out.", { retryable: true, providerId: this.id, modelId: this.model });
      if (error instanceof TypeError) throw new SchoolAIError("NETWORK", "Gemini is temporarily unreachable.", { retryable: true, providerId: this.id, modelId: this.model });
      throw new SchoolAIError("UNKNOWN", "Gemini interpretation failed safely.", { providerId: this.id, modelId: this.model });
    }
    const body = await response.json().catch(() => undefined) as GeminiResponse | undefined;
    if (!response.ok) throw safeProviderError(response.status, body, this.id, this.model);
    const refusal = blocked(body?.promptFeedback?.blockReason, this.id, this.model);
    if (refusal) throw refusal;
    const candidate = body?.candidates?.[0];
    const candidateRefusal = blocked(candidate?.finishReason && ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(candidate.finishReason) ? candidate.finishReason : undefined, this.id, this.model);
    if (candidateRefusal) throw candidateRefusal;
    const text = candidate?.content?.parts?.flatMap((part) => typeof part.text === "string" ? [part.text] : []).join("").trim();
    if (!text) throw new SchoolAIError("MALFORMED_RESPONSE", "Gemini returned no structured interpretation.", { providerId: this.id, modelId: this.model });
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new SchoolAIError("MALFORMED_RESPONSE", "Gemini returned malformed structured data.", { providerId: this.id, modelId: this.model }); }
    return { candidate: parsed, providerId: this.id, modelId: this.model, responseStatus: "ok", warnings: [], durationMs: Date.now() - startedAt, ...(body?.usageMetadata ? { usage: { ...(typeof body.usageMetadata.promptTokenCount === "number" ? { inputTokens: body.usageMetadata.promptTokenCount } : {}), ...(typeof body.usageMetadata.candidatesTokenCount === "number" ? { outputTokens: body.usageMetadata.candidatesTokenCount } : {}) } } : {}) };
  }
}

export function getGeminiSchoolAIProvider() { return new GeminiSchoolAIProvider(); }
