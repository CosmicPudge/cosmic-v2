export const MAX_SCHOOL_AUDIO_BYTES = 50 * 1024 * 1024;
export const SCHOOL_AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/webm", "audio/aac", "audio/ogg", "audio/mpga"] as const;
export type SchoolAudioMimeType = typeof SCHOOL_AUDIO_TYPES[number];

const extensions = new Map([[".mp3", "audio/mpeg"], [".m4a", "audio/mp4"], [".wav", "audio/wav"], [".webm", "audio/webm"], [".aac", "audio/aac"], [".ogg", "audio/ogg"]]);
const mimeAliases = new Map([["audio/mp3", "audio/mpeg"], ["audio/m4a", "audio/mp4"], ["audio/x-m4a", "audio/mp4"], ["audio/x-wav", "audio/wav"], ["video/mp4", "audio/mp4"]]);
export type SchoolAudioValidationCode = "audio_empty" | "audio_too_large" | "audio_signature_unrecognized" | "audio_mime_unsupported";
export class SchoolAudioValidationError extends Error { readonly code: SchoolAudioValidationCode; constructor(code: SchoolAudioValidationCode, message: string) { super(message); this.name = "SchoolAudioValidationError"; this.code = code; } }
export type SchoolAudioSignatureKind = "empty" | "wav" | "ogg" | "webm" | "mp4" | "aac" | "mp3" | "unknown";
export function validateSchoolAudio(file: { type: string; name: string; size: number }, bytes?: Uint8Array): SchoolAudioMimeType {
  if (file.size <= 0 || (bytes && bytes.byteLength === 0)) throw new SchoolAudioValidationError("audio_empty", "The recording is empty.");
  if (file.size > MAX_SCHOOL_AUDIO_BYTES || (bytes && bytes.byteLength > MAX_SCHOOL_AUDIO_BYTES)) throw new SchoolAudioValidationError("audio_too_large", "Recording exceeds the 50 MB size limit.");
  const rawMime = file.type.toLowerCase().split(";", 1)[0]?.trim() ?? "";
  const claimedMime = mimeAliases.get(rawMime) ?? ((SCHOOL_AUDIO_TYPES as readonly string[]).includes(rawMime) ? rawMime : extensions.get(file.name.toLowerCase().slice(file.name.lastIndexOf("."))));
  if (bytes) { const detected = detectAudioMime(bytes); if (!detected) throw new SchoolAudioValidationError("audio_signature_unrecognized", "The recording could not be validated as an audio file."); return detected; }
  if (!claimedMime) throw new SchoolAudioValidationError("audio_mime_unsupported", "Unsupported recording. Use MP3, M4A, WAV, WEBM, AAC, or OGG.");
  return claimedMime as SchoolAudioMimeType;
}
export function normalizeSchoolAudioMime(type: string, name = "") {
  const rawMime = type.toLowerCase().split(";", 1)[0]?.trim() ?? "";
  return mimeAliases.get(rawMime) ?? ((SCHOOL_AUDIO_TYPES as readonly string[]).includes(rawMime) ? rawMime : extensions.get(name.toLowerCase().slice(name.lastIndexOf(".")))) ?? null;
}
export function detectSchoolAudioSignature(bytes: Uint8Array): SchoolAudioSignatureKind {
  if (bytes.length === 0) return "empty";
  const text = (start: number, length: number) => new TextDecoder().decode(bytes.slice(start, start + length));
  if (bytes.length >= 12 && text(0, 4) === "RIFF" && text(8, 4) === "WAVE") return "wav";
  if (bytes.length >= 4 && text(0, 4) === "OggS") return "ogg";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "webm";
  if (bytes.length >= 8 && text(4, 4) === "ftyp") return "mp4";
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0) return "aac";
  if (bytes.length >= 3 && (text(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) return "mp3";
  return "unknown";
}
function detectAudioMime(bytes: Uint8Array): SchoolAudioMimeType | null {
  const kind = detectSchoolAudioSignature(bytes);
  return kind === "wav" ? "audio/wav" : kind === "ogg" ? "audio/ogg" : kind === "webm" ? "audio/webm" : kind === "mp4" ? "audio/mp4" : kind === "aac" ? "audio/aac" : kind === "mp3" ? "audio/mpeg" : null;
}

export type TranscriptSegment = { start: number; end: number; text: string };
export type SchoolTranscriptResult = { text: string; segments?: TranscriptSegment[]; language?: string; durationSeconds?: number; provider: string; model: string };
export type TranscriptionResult = SchoolTranscriptResult;
export type SchoolTranscriptionFailureCode = "transcription_quota" | "transcription_rate_limit" | "transcription_timeout" | "transcription_provider_unavailable" | "transcription_invalid_audio" | "transcription_unsupported_audio" | "transcription_too_large" | "transcription_auth_configuration" | "transcription_unknown";
export class SchoolTranscriptionError extends Error { readonly code: SchoolTranscriptionFailureCode; readonly retryable: boolean; readonly status?: number; constructor(code: SchoolTranscriptionFailureCode, options?: { retryable?: boolean; status?: number }) { super(code); this.name = "SchoolTranscriptionError"; this.code = code; this.retryable = options?.retryable ?? ["transcription_quota", "transcription_rate_limit", "transcription_timeout", "transcription_provider_unavailable"].includes(code); this.status = options?.status; } }
