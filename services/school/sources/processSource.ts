import type { SchoolSource } from "@/core/contracts/SchoolIntelligence";
import { extractDocumentIntelligence } from "./intelligence";
import { normalizeSourceText } from "./normalizeText";
import { extractWithAI, mergeSchoolIntelligence, SchoolAIExtractionError } from "./aiExtract";
import { AIProviderError } from "@/services/ai/provider";

export function processSchoolSource(source: SchoolSource, text: string) {
  const normalized = normalizeSourceText(text);
  if (normalized.length < 20) throw new Error("Unable to extract readable text from this source.");
  return { extractedText: normalized, intelligence: extractDocumentIntelligence(source, normalized), processedAt: new Date() };
}

export async function processSchoolSourceWithAI(source: SchoolSource, text: string) {
  const deterministic = processSchoolSource(source, text);
  if (!process.env.OPENAI_API_KEY?.trim()) {
    reportAIStatus("unavailable", "provider_not_configured");
    return { ...deterministic, intelligence: deterministic.intelligence, processingStatus: "ready_degraded" as const, processingError: "AI analysis is unavailable; deterministic extraction is ready." };
  }
  try {
    const ai = await extractWithAI(source, deterministic.extractedText);
    const intelligence = mergeSchoolIntelligence(deterministic.intelligence, ai);
    if (!ai.facts.length && !ai.events.length && !ai.actionItems.length) reportAIStatus("complete", "no_valid_intelligence");
    return { ...deterministic, intelligence, processingStatus: intelligence.warnings.length ? "needs_review" as const : "ready" as const, processingError: null };
  } catch (error) {
    const code = error instanceof AIProviderError
      ? formatProviderError(error)
      : error instanceof SchoolAIExtractionError ? error.code
        : error instanceof DOMException && error.name === "TimeoutError" ? "timeout"
          : "provider_request_failed";
    reportAIStatus("unavailable", code);
    return { ...deterministic, intelligence: deterministic.intelligence, processingStatus: "ready_degraded" as const, processingError: "AI analysis was unavailable; deterministic extraction is ready." };
  }
}

function formatProviderError(error: AIProviderError) {
  if (error.code === "provider_not_configured") return error.code;
  const metadata = error.metadata;
  return [
    `${error.code} status=${metadata?.status ?? error.status ?? "unknown"}`,
    metadata?.code ? `code=${metadata.code}` : "",
    metadata?.type ? `type=${metadata.type}` : "",
    metadata?.retryAfter ? `retry_after=${metadata.retryAfter}` : "",
    metadata?.requestId ? `request_id=${metadata.requestId}` : "",
  ].filter(Boolean).join(" ");
}

function reportAIStatus(status: "unavailable" | "complete", reason: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[school-ai] ${status}: ${reason}`);
}
