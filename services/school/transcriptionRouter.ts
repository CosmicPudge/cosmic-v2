// @ts-expect-error Next resolves the server-side TypeScript module extension.
import { SchoolTranscriptionError, type SchoolTranscriptResult } from "./audio.ts";
// @ts-expect-error Next resolves the server-side TypeScript module extension.
import { CloudflareTranscriptionProvider, OpenAITranscriptionProvider, type SchoolTranscriptionInput, type SchoolTranscriptionProvider } from "./transcriptionProviders.ts";

export type SchoolTranscriptionAttempt = { provider: string; model: string; outcome: "success" | "failure" | "skipped"; code?: string; attemptedAt: string };
export type SchoolTranscriptionRouterResult = { result: SchoolTranscriptResult; attempts: SchoolTranscriptionAttempt[] };
export type SchoolTranscriptionRouterInput = SchoolTranscriptionInput & { voiceNoteId?: string };
function logStage(voiceNoteId: string | undefined, stage: string, fields: Record<string, string>) { if (process.env.NODE_ENV === "production") console.info("voice_note_processing_stage", { operation: "voice_note_processing_stage", ...(voiceNoteId ? { voiceNoteId } : {}), stage, ...fields }); }

function preference(): "cloudflare" | "openai" | "auto" { const value = process.env.SCHOOL_TRANSCRIPTION_PROVIDER?.trim().toLowerCase(); return value === "cloudflare" || value === "openai" || value === "auto" ? value : "auto"; }
function providers(): SchoolTranscriptionProvider[] { const all = [new CloudflareTranscriptionProvider(), new OpenAITranscriptionProvider()]; const preferred = preference(); if (preferred === "openai") return [all[1], all[0]]; return preferred === "cloudflare" ? [all[0], all[1]] : all; }

export function getSchoolTranscriptionProviders() { return providers(); }
export async function transcribeWithSchoolRouter(input: SchoolTranscriptionRouterInput): Promise<SchoolTranscriptionRouterResult> {
  const attempts: SchoolTranscriptionAttempt[] = []; let lastError: SchoolTranscriptionError | undefined;
  for (const provider of providers()) {
    const attemptedAt = new Date().toISOString();
    if (!provider.isConfigured()) { attempts.push({ provider: provider.id, model: provider.model, outcome: "skipped", code: "transcription_auth_configuration", attemptedAt }); continue; }
    if (!provider.supports(input)) { attempts.push({ provider: provider.id, model: provider.model, outcome: "skipped", code: input.bytes.byteLength > (provider.maxBytes ?? Number.MAX_SAFE_INTEGER) ? "transcription_too_large" : "transcription_unsupported_audio", attemptedAt }); continue; }
    logStage(input.voiceNoteId, "transcription_provider_started", { provider: provider.id, model: provider.model, result: "started" });
    try { const result = await provider.transcribe(input); attempts.push({ provider: provider.id, model: provider.model, outcome: "success", attemptedAt }); logStage(input.voiceNoteId, "transcription_provider_finished", { provider: provider.id, model: provider.model, result: "success" }); return { result, attempts }; } catch (error) {
      const normalized = error instanceof SchoolTranscriptionError ? error : new SchoolTranscriptionError("transcription_unknown", { retryable: false }); lastError = normalized; attempts.push({ provider: provider.id, model: provider.model, outcome: "failure", code: normalized.code, attemptedAt }); logStage(input.voiceNoteId, "transcription_provider_finished", { provider: provider.id, model: provider.model, result: "failure", safeErrorCode: normalized.code }); if (!normalized.retryable) break;
    }
  }
  throw Object.assign(lastError ?? new SchoolTranscriptionError("transcription_auth_configuration", { retryable: false }), { attempts });
}
