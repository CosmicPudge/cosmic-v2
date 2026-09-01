import "server-only";
import type { CosmicAIMessage } from "@/core/contracts/AI";
import { AIProviderError, createAIProviderError } from "./providerErrors";
export { AIProviderError } from "./providerErrors";

export interface AIProviderInput { messages: CosmicAIMessage[]; context: string; }
export interface AIProviderImageInput { bytes: Uint8Array; mimeType: "image/png" | "image/jpeg" | "image/webp"; context: string; prompt: string; }
export interface AIProvider { id: string; model: string; generate(input: AIProviderInput): Promise<string>; generateImage?(input: AIProviderImageInput): Promise<string>; stream(input: AIProviderInput): Promise<Response>; }

function configured() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AIProviderError("provider_not_configured");
  return key;
}

function payload(input: AIProviderInput) { return { model: process.env.COSMIC_AI_MODEL || "gpt-5.4-mini", instructions: input.context, input: input.messages.map((message) => ({ role: message.role, content: [{ type: "input_text", text: message.content }] })), max_output_tokens: 1200, store: false }; }

export function getAIProvider(): AIProvider {
  return {
    id: "openai", model: process.env.COSMIC_AI_MODEL || "gpt-5.4-mini",
    async generate(input) {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${configured()}`, "Content-Type": "application/json" }, body: JSON.stringify(payload(input)), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw await createAIProviderError(response);
      const data = await response.json() as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }> };
      return typeof data.output_text === "string" ? data.output_text : data.output?.flatMap((item) => item.content ?? []).map((item) => typeof item.text === "string" ? item.text : "").join("").trim() || "Cosmic AI returned no text.";
    },
    async generateImage(input) {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${configured()}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.COSMIC_AI_VISION_MODEL || process.env.COSMIC_AI_MODEL || "gpt-4.1-mini", instructions: input.context, input: [{ role: "user", content: [{ type: "input_text", text: input.prompt }, { type: "input_image", image_url: `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`, detail: "high" }] }], text: { format: { type: "json_schema", name: "school_image_extraction", strict: true, schema: { type: "object", additionalProperties: false, properties: { transcription: { type: "string" }, courseEvidence: { type: "string" }, courseState: { type: "string", enum: ["confirmed", "likely", "ambiguous", "unknown"] }, courseId: { type: ["string", "null"] }, findings: { type: "array", items: { type: "object", additionalProperties: false, properties: { type: { type: "string", enum: ["note", "topic", "assignment", "event", "requirement"] }, title: { type: "string" }, content: { type: "string" }, dueAt: { type: ["string", "null"] }, startsAt: { type: ["string", "null"] }, endsAt: { type: ["string", "null"] }, requirementCategory: { type: ["string", "null"] }, evidence: { type: "string" }, confidence: { type: "number" }, explicitness: { type: "string", enum: ["explicit", "uncertain"] } }, required: ["type", "title", "content", "dueAt", "startsAt", "endsAt", "requirementCategory", "evidence", "confidence", "explicitness"] } }, uncertainties: { type: "array", items: { type: "string" } } }, required: ["transcription", "courseEvidence", "courseState", "courseId", "findings", "uncertainties"] } } }, max_output_tokens: 2200, store: false }), signal: AbortSignal.timeout(45_000) });
      if (!response.ok) throw await createAIProviderError(response);
      const data = await response.json() as { output_text?: unknown };
      if (typeof data.output_text !== "string") throw new AIProviderError("provider_request_failed", 502, { status: 502 });
      return data.output_text;
    },
    async stream(input) {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${configured()}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(input), stream: true }), signal: AbortSignal.timeout(45_000) });
      if (!response.ok) throw await createAIProviderError(response);
      if (!response.body) throw new AIProviderError("provider_request_failed", response.status, { status: response.status });
      return response;
    },
  };
}
