// @ts-expect-error Next resolves the server-side TypeScript module extension.
import { SCHOOL_AUDIO_TYPES, type SchoolAudioMimeType, type SchoolTranscriptResult, SchoolTranscriptionError, type TranscriptSegment } from "./audio.ts";

export type SchoolTranscriptionInput = { bytes: Uint8Array; mimeType: SchoolAudioMimeType; fileName: string };
export interface SchoolTranscriptionProvider { id: "openai" | "cloudflare"; model: string; maxBytes?: number; isConfigured(): boolean; supports(input: SchoolTranscriptionInput): boolean; transcribe(input: SchoolTranscriptionInput): Promise<SchoolTranscriptResult>; }

function parseSegments(value: unknown): TranscriptSegment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const segments = value.flatMap((item) => { if (!item || typeof item !== "object") return []; const segment = item as Record<string, unknown>; const start = typeof segment.start === "number" ? segment.start : typeof segment.startTime === "number" ? segment.startTime : undefined; const end = typeof segment.end === "number" ? segment.end : typeof segment.endTime === "number" ? segment.endTime : undefined; const text = typeof segment.text === "string" ? segment.text.trim() : ""; return start !== undefined && end !== undefined && text ? [{ start, end, text }] : []; });
  return segments.length ? segments : undefined;
}

function errorForResponse(status: number, provider: string): SchoolTranscriptionError {
  if (status === 400 || status === 415) return new SchoolTranscriptionError(status === 415 ? "transcription_unsupported_audio" : "transcription_invalid_audio", { status });
  if (status === 401 || status === 403) return new SchoolTranscriptionError("transcription_auth_configuration", { retryable: false, status });
  if (status === 413) return new SchoolTranscriptionError("transcription_too_large", { retryable: false, status });
  if (status === 429) return new SchoolTranscriptionError(status === 429 && provider === "openai" ? "transcription_quota" : "transcription_rate_limit", { status });
  if (status >= 500) return new SchoolTranscriptionError("transcription_provider_unavailable", { status });
  return new SchoolTranscriptionError("transcription_unknown", { retryable: false, status });
}

function checkInput(input: SchoolTranscriptionInput, maxBytes?: number) {
  if (!(SCHOOL_AUDIO_TYPES as readonly string[]).includes(input.mimeType)) throw new SchoolTranscriptionError("transcription_unsupported_audio", { retryable: false });
  if (maxBytes !== undefined && input.bytes.byteLength > maxBytes) throw new SchoolTranscriptionError("transcription_too_large", { retryable: false });
}

export class OpenAITranscriptionProvider implements SchoolTranscriptionProvider {
  readonly id = "openai" as const;
  readonly model = process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe";
  readonly maxBytes = 25 * 1024 * 1024;
  isConfigured() { return Boolean(process.env.OPENAI_API_KEY?.trim()); }
  supports(input: SchoolTranscriptionInput) { return (SCHOOL_AUDIO_TYPES as readonly string[]).includes(input.mimeType) && input.bytes.byteLength <= this.maxBytes; }
  async transcribe(input: SchoolTranscriptionInput): Promise<SchoolTranscriptResult> {
    checkInput(input, this.maxBytes); const key = process.env.OPENAI_API_KEY?.trim(); if (!key) throw new SchoolTranscriptionError("transcription_auth_configuration", { retryable: false });
    const form = new FormData(); form.append("file", new Blob([new Uint8Array(input.bytes).buffer as ArrayBuffer], { type: input.mimeType }), input.fileName); form.append("model", this.model); form.append("response_format", "verbose_json");
    let response: Response; try { response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(60_000) }); } catch { throw new SchoolTranscriptionError("transcription_timeout"); }
    if (!response.ok) throw errorForResponse(response.status, this.id);
    const data = await response.json().catch(() => null) as { text?: unknown; segments?: unknown; language?: unknown; duration?: unknown } | null;
    if (typeof data?.text !== "string" || !data.text.trim()) throw new SchoolTranscriptionError("transcription_unknown", { retryable: false });
    return { text: data.text.trim(), segments: parseSegments(data.segments), language: typeof data.language === "string" ? data.language : undefined, durationSeconds: typeof data.duration === "number" ? data.duration : undefined, provider: this.id, model: this.model };
  }
}

export class CloudflareTranscriptionProvider implements SchoolTranscriptionProvider {
  readonly id = "cloudflare" as const;
  readonly model = process.env.CLOUDFLARE_TRANSCRIPTION_MODEL?.trim() || "@cf/openai/whisper-large-v3-turbo";
  isConfigured() { return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() && process.env.CLOUDFLARE_AI_API_TOKEN?.trim()); }
  supports(input: SchoolTranscriptionInput) { return (SCHOOL_AUDIO_TYPES as readonly string[]).includes(input.mimeType); }
  async transcribe(input: SchoolTranscriptionInput): Promise<SchoolTranscriptResult> {
    checkInput(input); const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim(); const token = process.env.CLOUDFLARE_AI_API_TOKEN?.trim(); if (!accountId || !token) throw new SchoolTranscriptionError("transcription_auth_configuration", { retryable: false });
    let response: Response; try { response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodeURIComponent(this.model)}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ audio: Buffer.from(input.bytes).toString("base64"), task: "transcribe" }), signal: AbortSignal.timeout(60_000) }); } catch { throw new SchoolTranscriptionError("transcription_timeout"); }
    if (!response.ok) throw errorForResponse(response.status, this.id);
    const body = await response.json().catch(() => null) as { result?: unknown } | null; const result = body?.result && typeof body.result === "object" ? body.result as Record<string, unknown> : {}; const text = typeof result.text === "string" ? result.text.trim() : "";
    if (!text) throw new SchoolTranscriptionError("transcription_unknown", { retryable: false });
    return { text, segments: parseSegments(result.segments), language: typeof result.language === "string" ? result.language : undefined, durationSeconds: typeof result.duration === "number" ? result.duration : undefined, provider: this.id, model: this.model };
  }
}
