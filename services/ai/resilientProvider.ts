import { getConfiguredAIProviders, type AIProviderId } from "./providers/providerRouter";
import { AIProviderError } from "./providerErrors";
import type { AIProvider, AIProviderInput } from "./provider";

export function isTransientAIProviderError(error: unknown) {
  if (!(error instanceof AIProviderError)) return false;
  return error.metadata?.code === "timeout" || error.metadata?.code === "request_failed" || [429, 500, 502, 503, 504].includes(error.status ?? error.metadata?.status ?? 0);
}

export async function generateWithBoundedResilience(input: AIProviderInput, options: { operation: string; transcriptId?: string; chunkIndex?: number; chunkCount?: number; providerPreference?: AIProviderId[] }, candidates?: AIProvider[]) {
  const providers = candidates ?? getConfiguredAIProviders(options.providerPreference);
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const cloudflareConfigured = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() && process.env.CLOUDFLARE_AI_API_TOKEN?.trim());
  if (process.env.NODE_ENV !== "test") console.info("school_ai_provider_plan", { operation: options.operation, primaryProvider: providers[0]?.id ?? "none", fallbackProvider: providers[1]?.id ?? null, fallbackConfigured: providers.length > 1, openAiConfigured, cloudflareConfigured });
  if (!providers.length) throw new AIProviderError("provider_not_configured");
  let lastError: unknown;
  for (const [providerIndex, provider] of providers.entries()) {
    const attempts = providerIndex === 0 ? 2 : 1;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const startedAt = Date.now();
      try {
        if (process.env.NODE_ENV !== "test") console.info("school_ai_operation", { operation: options.operation, stage: "request", provider: provider.id, model: provider.model, attempt, fallbackUsed: providerIndex > 0, ...(options.transcriptId ? { transcriptId: options.transcriptId } : {}), ...(options.chunkIndex !== undefined ? { chunkIndex: options.chunkIndex, chunkCount: options.chunkCount } : {}), inputCharacterCount: input.messages.reduce((total, message) => total + message.content.length, 0) });
        const value = await provider.generate(input);
        if (process.env.NODE_ENV !== "test") console.info("school_ai_operation", { operation: options.operation, stage: "success", provider: provider.id, model: provider.model, attempt, fallbackUsed: providerIndex > 0, ...(options.transcriptId ? { transcriptId: options.transcriptId } : {}), ...(options.chunkIndex !== undefined ? { chunkIndex: options.chunkIndex, chunkCount: options.chunkCount } : {}), inputCharacterCount: input.messages.reduce((total, message) => total + message.content.length, 0), responseCharacterCount: value.length, durationMs: Date.now() - startedAt });
        return { value, provider };
      } catch (error) {
        lastError = error;
        const transient = isTransientAIProviderError(error);
        if (process.env.NODE_ENV !== "test") console.info("school_ai_operation", { operation: options.operation, stage: "failure", provider: provider.id, model: provider.model, attempt, fallbackUsed: providerIndex > 0, ...(options.transcriptId ? { transcriptId: options.transcriptId } : {}), ...(options.chunkIndex !== undefined ? { chunkIndex: options.chunkIndex, chunkCount: options.chunkCount } : {}), inputCharacterCount: input.messages.reduce((total, message) => total + message.content.length, 0), durationMs: Date.now() - startedAt, errorClassification: transient ? "transient_provider_failure" : error instanceof AIProviderError ? error.code : "unknown" });
        if (!transient) throw error;
      }
    }
  }
  throw lastError;
}
