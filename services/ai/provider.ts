import "server-only";
import type { CosmicAIMessage } from "@/core/contracts/AI";
import { AIProviderError, createAIProviderError } from "./providerErrors";
import { getConfiguredAIProvider, getConfiguredAIProviders, registerOpenAIProvider, type AIProviderId } from "./providers/providerRouter";
import { classifyMetricError, estimateAICostUsd, recordAIMetric } from "@/services/observability/metrics";
export { AIProviderError } from "./providerErrors";

export interface AIProviderInput { messages: CosmicAIMessage[]; context: string; responseFormat?: { name: string; schema: Record<string, unknown> }; maxOutputTokens?: number; model?: string; timeoutMs?: number; feature?: string; taskCategory?: string; }
export interface AIProviderImageInput { bytes: Uint8Array; mimeType: "image/png" | "image/jpeg" | "image/webp"; context: string; prompt: string; feature?: string; }
export interface AIProvider { id: string; model: string; generate(input: AIProviderInput): Promise<string>; generateImage?(input: AIProviderImageInput): Promise<string>; stream(input: AIProviderInput): Promise<Response>; }

function configured() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AIProviderError("provider_not_configured");
  return key;
}

function payload(input: AIProviderInput) { return { model: input.model || process.env.COSMIC_AI_MODEL || "gpt-5.4-mini", instructions: input.context, input: input.messages.map((message) => ({ role: message.role, content: [{ type: "input_text", text: message.content }] })), ...(input.responseFormat ? { text: { format: { type: "json_schema", name: input.responseFormat.name, strict: true, schema: input.responseFormat.schema } } } : {}), max_output_tokens: input.maxOutputTokens ?? 1200, store: false }; }

function usageValues(usage: unknown) {
  const value = usage && typeof usage === "object" ? usage as Record<string, unknown> : {};
  const cached = value.input_tokens_details && typeof value.input_tokens_details === "object" ? (value.input_tokens_details as Record<string, unknown>).cached_tokens : undefined;
  return { inputTokens: typeof value.input_tokens === "number" ? value.input_tokens : undefined, outputTokens: typeof value.output_tokens === "number" ? value.output_tokens : undefined, cachedTokens: typeof cached === "number" ? cached : undefined };
}

function instrumentStreamingResponse(response: Response, input: AIProviderInput, provider: string, model: string, startedAt: number): Response {
  if (!response.body) return response;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let usage: unknown;
  const inspect = (chunk: string) => {
    buffer += chunk;
    const packets = buffer.split("\n\n");
    buffer = packets.pop() || "";
    for (const packet of packets) {
      const line = packet.split("\n").find((item) => item.startsWith("data:"));
      if (!line) continue;
      try {
        const parsed = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
        if (parsed.usage) usage = parsed.usage;
        if (parsed.response && typeof parsed.response === "object" && (parsed.response as Record<string, unknown>).usage) usage = (parsed.response as Record<string, unknown>).usage;
      } catch { /* Provider keepalives and partial packets are ignored. */ }
    }
  };
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          inspect(decoder.decode(result.value, { stream: true }));
          controller.enqueue(result.value);
        }
        inspect(decoder.decode());
        const values = usageValues(usage);
        recordAIMetric({ provider, model, feature: input.feature || "stream", durationMs: performance.now() - startedAt, ...values, estimatedCostUsd: estimateAICostUsd({ provider, model, ...values }) });
        controller.close();
      } catch (error) {
        recordAIMetric({ provider, model, feature: input.feature || "stream", durationMs: performance.now() - startedAt, errorCategory: classifyMetricError(error) });
        controller.error(error);
      }
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  return new Response(stream, { status: response.status, statusText: response.statusText, headers: response.headers });
}

function getOpenAIProvider(): AIProvider {
  return {
    id: "openai", model: process.env.COSMIC_AI_MODEL || "gpt-5.4-mini",
    async generate(input) {
      const startedAt = performance.now();
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${configured()}`, "Content-Type": "application/json" }, body: JSON.stringify(payload(input)), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw await createAIProviderError(response);
      const data = await response.json() as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }>; usage?: { input_tokens?: unknown; output_tokens?: unknown; input_tokens_details?: { cached_tokens?: unknown } } };
      const values = usageValues(data.usage); const model = input.model || this.model;
      recordAIMetric({ provider: "openai", model, feature: input.feature || "generate", durationMs: performance.now() - startedAt, ...values, estimatedCostUsd: estimateAICostUsd({ provider: "openai", model, ...values }) });
      return typeof data.output_text === "string" ? data.output_text : data.output?.flatMap((item) => item.content ?? []).map((item) => typeof item.text === "string" ? item.text : "").join("").trim() || "Cosmic AI returned no text.";
    },
    async generateImage(input) {
      const startedAt = performance.now();
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${configured()}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.COSMIC_AI_VISION_MODEL || process.env.COSMIC_AI_MODEL || "gpt-4.1-mini", instructions: input.context, input: [{ role: "user", content: [{ type: "input_text", text: input.prompt }, { type: "input_image", image_url: `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`, detail: "high" }] }], text: { format: { type: "json_schema", name: "school_image_extraction", strict: true, schema: { type: "object", additionalProperties: false, properties: { transcription: { type: "string" }, courseEvidence: { type: "string" }, courseState: { type: "string", enum: ["confirmed", "likely", "ambiguous", "unknown"] }, courseId: { type: ["string", "null"] }, findings: { type: "array", items: { type: "object", additionalProperties: false, properties: { type: { type: "string", enum: ["note", "topic", "assignment", "event", "requirement"] }, title: { type: "string" }, content: { type: "string" }, dueAt: { type: ["string", "null"] }, startsAt: { type: ["string", "null"] }, endsAt: { type: ["string", "null"] }, requirementCategory: { type: ["string", "null"] }, evidence: { type: "string" }, confidence: { type: "number" }, explicitness: { type: "string", enum: ["explicit", "uncertain"] } }, required: ["type", "title", "content", "dueAt", "startsAt", "endsAt", "requirementCategory", "evidence", "confidence", "explicitness"] } }, uncertainties: { type: "array", items: { type: "string" } } }, required: ["transcription", "courseEvidence", "courseState", "courseId", "findings", "uncertainties"] } } }, max_output_tokens: 2200, store: false }), signal: AbortSignal.timeout(45_000) });
      if (!response.ok) throw await createAIProviderError(response);
      const data = await response.json() as { output_text?: unknown; usage?: { input_tokens?: unknown; output_tokens?: unknown; input_tokens_details?: { cached_tokens?: unknown } } };
      const model = process.env.COSMIC_AI_VISION_MODEL || process.env.COSMIC_AI_MODEL || "gpt-4.1-mini"; const values = usageValues(data.usage);
      recordAIMetric({ provider: "openai", model, feature: input.feature || "image", durationMs: performance.now() - startedAt, ...values, estimatedCostUsd: estimateAICostUsd({ provider: "openai", model, ...values }) });
      if (typeof data.output_text !== "string") throw new AIProviderError("provider_request_failed", 502, { status: 502 });
      return data.output_text;
    },
    async stream(input) {
      const startedAt = performance.now(); const model = input.model || this.model;
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${configured()}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(input), stream: true }), signal: AbortSignal.timeout(input.timeoutMs ?? 45_000) });
      if (!response.ok) throw await createAIProviderError(response);
      if (!response.body) throw new AIProviderError("provider_request_failed", response.status, { status: response.status });
      return instrumentStreamingResponse(response, input, "openai", model, startedAt);
    },
  };
}

registerOpenAIProvider(getOpenAIProvider);
export function getAIProvider(): AIProvider { return getConfiguredAIProvider(); }
export function getAIProviderCandidates(preference?: AIProviderId[]): AIProvider[] { return getConfiguredAIProviders(preference); }
